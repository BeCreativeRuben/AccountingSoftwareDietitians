import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserById } from '@/lib/auth';
import type { ApiResponse, User } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }
    
    // Verify token and get user
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !authUser) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Invalid token',
        },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await getUserById(authUser.id);
    
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      },
      { status: 500 }
    );
  }
}
