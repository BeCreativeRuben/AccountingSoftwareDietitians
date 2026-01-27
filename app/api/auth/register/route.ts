import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { SignupRequest, ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    
    // Validate input
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Email, password, and name are required',
        },
        { status: 400 }
      );
    }
    
    if (body.password.length < 8) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Password must be at least 8 characters',
        },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', body.email)
      .eq('deleted_at', null)
      .single();
    
    if (existingUser.data) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }
    
    // Create user
    const { user, encryptionKeySalt } = await createUser(body);
    
    // Sign in the user to get session
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    
    if (authError || !authData.session) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Failed to create session',
        },
        { status: 500 }
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
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}
