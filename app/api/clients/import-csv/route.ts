import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/clients';
import Papa from 'papaparse';
import type { ApiResponse, ClientDecrypted, InsuranceCompany } from '@/lib/types';

const VALID_INSURANCE: InsuranceCompany[] = [
  'Christelijke' as InsuranceCompany,
  'Liberale' as InsuranceCompany,
  'Solidaris' as InsuranceCompany,
  'Helan' as InsuranceCompany,
  'Vlaams/Neutraal' as InsuranceCompany,
];

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Invalid CSV format' },
        { status: 400 }
      );
    }

    const created: ClientDecrypted[] = [];
    const errors: string[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const name = (row.name || row.naam || row.Name || '').trim();
      const insuranceCompany = (row.insurance || row.verzekering || row.insuranceCompany || '').trim();

      if (!name) {
        errors.push(`Row ${i + 2}: Name is required`);
        continue;
      }

      const insurance = VALID_INSURANCE.includes(insuranceCompany as InsuranceCompany)
        ? (insuranceCompany as InsuranceCompany)
        : ('Christelijke' as InsuranceCompany);

      try {
        const client = await createClient(userId, {
          name,
          email: (row.email || row.Email || '').trim() || undefined,
          phone: (row.phone || row.telefoon || row.Phone || '').trim() || undefined,
          dateOfBirth: (row.dateOfBirth || row.dob || row.geboortedatum || '').trim() || undefined,
          insuranceCompany: insurance,
          insuranceNumber: (row.insuranceNumber || row.verzekeringsnummer || '').trim() || undefined,
          notes: (row.notes || row.opmerkingen || '').trim() || undefined,
          importSource: 'csv_import',
        });
        created.push(client);
      } catch (e) {
        errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : 'Failed'}`);
      }
    }

    return NextResponse.json<ApiResponse<{ created: ClientDecrypted[]; errors: string[] }>>({
      success: true,
      data: { created, errors },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
