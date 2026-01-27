import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase/server';
import { generateSalt, deriveEncryptionKey } from './encryption';
import type { User, SignupRequest, LoginRequest } from './types';

/**
 * Hash password using bcrypt-like approach (Supabase handles this)
 * For now, we'll use a simple hash - Supabase Auth will handle proper hashing
 */
export function hashPassword(password: string): string {
  // In production, Supabase Auth handles password hashing
  // This is a placeholder - Supabase uses bcrypt internally
  return password; // Supabase will hash it
}

/**
 * Verify password (Supabase handles this)
 */
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  // Supabase Auth handles password verification
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });
  
  return !error && !!data.user;
}

/**
 * Create a new user account
 */
export async function createUser(request: SignupRequest): Promise<{ user: User; encryptionKeySalt: string }> {
  // Generate encryption key salt
  const encryptionKeySalt = generateSalt();
  
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email: request.email,
    password: request.password,
    options: {
      data: {
        name: request.name,
        clinicName: request.clinicName,
        encryptionKeySalt,
      },
    },
  });
  
  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create user');
  }
  
  // Create user record in our users table
  const { data: userData, error: dbError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: request.email,
      password_hash: '', // Supabase Auth handles this
      name: request.name,
      clinic_name: request.clinicName,
      encryption_key_salt: encryptionKeySalt,
    })
    .select()
    .single();
  
  if (dbError || !userData) {
    // Clean up auth user if DB insert fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(dbError?.message || 'Failed to create user record');
  }
  
  // Create default settings
  await supabaseAdmin
    .from('settings')
    .insert({
      user_id: authData.user.id,
      dark_mode: false,
      calendar_integration_enabled: false,
      default_appointment_duration_minutes: 60,
      client_data_retention_months: 6,
    });
  
  return {
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      clinicName: userData.clinic_name || undefined,
      clinicAddress: userData.clinic_address || undefined,
      clinicPhone: userData.clinic_phone || undefined,
      createdAt: new Date(userData.created_at),
    },
    encryptionKeySalt,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('deleted_at', null)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    clinicName: data.clinic_name || undefined,
    clinicAddress: data.clinic_address || undefined,
    clinicPhone: data.clinic_phone || undefined,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('deleted_at', null)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    clinicName: data.clinic_name || undefined,
    clinicAddress: data.clinic_address || undefined,
    clinicPhone: data.clinic_phone || undefined,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Get encryption key salt for user
 */
export async function getEncryptionKeySalt(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('encryption_key_salt')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.encryption_key_salt;
}
