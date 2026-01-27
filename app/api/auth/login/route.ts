import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserByEmail } from '@/lib/auth';
import type { LoginRequest, ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    
    if (authError || !authData.user || !authData.session) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    // Get user data from our database
    const user = await getUserByEmail(body.email);
    
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user,
        token: authData.session.access_token,
        expiresIn: authData.session.expires_in || 86400, // 24 hours
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}
