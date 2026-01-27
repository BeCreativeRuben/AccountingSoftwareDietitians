import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      // Sign out the session
      await supabaseAdmin.auth.signOut();
    }
    
    const response: ApiResponse<never> = {
      success: true,
      message: 'Logged out successfully',
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      },
      { status: 500 }
    );
  }
}
