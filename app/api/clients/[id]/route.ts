import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getClientById, updateClient, deleteClient } from '@/lib/clients';
import type { ApiResponse, ClientDecrypted, CreateClientRequest } from '@/lib/types';

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
    const client = await getClientById(userId, id);
    if (!client) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<ClientDecrypted>>({ success: true, data: client });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch client' },
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
    const body: Partial<CreateClientRequest> = await request.json();
    const client = await updateClient(userId, id, body);
    if (!client) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<ClientDecrypted>>({ success: true, data: client });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update client' },
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
    const ok = await deleteClient(userId, id);
    if (!ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<never>>({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete client' },
      { status: 500 }
    );
  }
}
