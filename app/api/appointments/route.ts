import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getAppointments, createAppointment } from '@/lib/appointments';
import type { ApiResponse, AppointmentDecrypted, CreateAppointmentRequest } from '@/lib/types';

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
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const clientId = searchParams.get('clientId') ?? undefined;

    const appointments = await getAppointments(userId, {
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      clientId,
    });

    return NextResponse.json<ApiResponse<AppointmentDecrypted[]>>({ success: true, data: appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch appointments' },
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

    const body: CreateAppointmentRequest = await request.json();
    if (!body.appointmentTypeId || !body.clientIds?.length || !body.startTime || !body.endTime) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Appointment type, client(s), start time and end time are required' },
        { status: 400 }
      );
    }

    const appointment = await createAppointment(userId, body);
    return NextResponse.json<ApiResponse<AppointmentDecrypted>>({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
