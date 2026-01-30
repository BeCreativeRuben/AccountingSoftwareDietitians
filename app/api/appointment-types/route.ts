import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { ApiResponse, AppointmentType } from '@/lib/types';

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

    const { data, error } = await supabaseAdmin
      .from('appointment_types')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw new Error(error.message);

    const types: AppointmentType[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      price: Number(row.price),
      durationMinutes: row.duration_minutes ?? 60,
      isCustom: row.is_custom ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    return NextResponse.json<ApiResponse<AppointmentType[]>>({ success: true, data: types });
  } catch (error) {
    console.error('Get appointment types error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch appointment types' },
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

    const body = await request.json();
    const { name, price, durationMinutes } = body;
    if (!name || price == null) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('appointment_types')
      .insert({
        user_id: userId,
        name: String(name).trim(),
        price: Number(price),
        duration_minutes: Number(durationMinutes) || 60,
        is_custom: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const type: AppointmentType = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      price: Number(data.price),
      durationMinutes: data.duration_minutes ?? 60,
      isCustom: data.is_custom ?? true,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json<ApiResponse<AppointmentType>>({ success: true, data: type }, { status: 201 });
  } catch (error) {
    console.error('Create appointment type error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create appointment type' },
      { status: 500 }
    );
  }
}
