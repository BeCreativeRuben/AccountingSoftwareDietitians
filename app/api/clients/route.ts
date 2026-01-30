import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getClients, createClient } from '@/lib/clients';
import type { ApiResponse, ClientDecrypted, CreateClientRequest } from '@/lib/types';

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const insuranceCompany = searchParams.get('insuranceCompany') ?? undefined;

    const clients = await getClients(userId, { search, insuranceCompany });
    return NextResponse.json<ApiResponse<ClientDecrypted[]>>({ success: true, data: clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch clients' },
      { status: 500 }
    );
  }
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

    const body: CreateClientRequest = await request.json();
    if (!body.name || !body.insuranceCompany) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Name and insurance company are required' },
        { status: 400 }
      );
    }

    const client = await createClient(userId, body);
    return NextResponse.json<ApiResponse<ClientDecrypted>>({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create client' },
      { status: 500 }
    );
  }
}
