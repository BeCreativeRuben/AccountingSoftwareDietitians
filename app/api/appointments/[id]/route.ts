import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getAppointmentById, updateAppointment, deleteAppointment } from '@/lib/appointments';
import type { ApiResponse, AppointmentDecrypted } from '@/lib/types';

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const appointment = await getAppointmentById(userId, id);
    if (!appointment) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<AppointmentDecrypted>>({ success: true, data: appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const appointment = await updateAppointment(userId, id, {
      appointmentTypeId: body.appointmentTypeId,
      clientIds: body.clientIds,
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status,
      notes: body.notes,
    });

    if (!appointment) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<AppointmentDecrypted>>({ success: true, data: appointment });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ok = await deleteAppointment(userId, id);
    if (!ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<never>>({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
