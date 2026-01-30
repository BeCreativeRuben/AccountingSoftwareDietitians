import { supabaseAdmin } from './supabase/server';
import { getEncryptionKeySalt } from './auth';
import {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  deriveServerEncryptionKey,
} from './encryption';
import type {
  ClientDecrypted,
  CreateClientRequest,
  InsuranceCompany,
  SolidarisMedicalCondition,
} from './types';

const ENCRYPTED_FIELDS = [
  'name_encrypted',
  'email_encrypted',
  'phone_encrypted',
  'date_of_birth_encrypted',
  'notes_encrypted',
  'insurance_number_encrypted',
  'medical_conditions_encrypted',
] as const;

async function getEncryptionKey(userId: string): Promise<Uint8Array> {
  const salt = await getEncryptionKeySalt(userId);
  if (!salt) throw new Error('User encryption salt not found');
  return deriveServerEncryptionKey(userId, salt);
}

function mapDbToClient(row: Record<string, unknown>, decrypted: Record<string, string>): ClientDecrypted {
  const medicalConditions = row.medical_conditions_encrypted
    ? (JSON.parse(decrypted.medical_conditions_encrypted || '[]') as SolidarisMedicalCondition[])
    : undefined;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: decrypted.name_encrypted || '',
    email: decrypted.email_encrypted || undefined,
    phone: decrypted.phone_encrypted || undefined,
    dateOfBirth: decrypted.date_of_birth_encrypted
      ? new Date(decrypted.date_of_birth_encrypted)
      : undefined,
    notes: decrypted.notes_encrypted || undefined,
    insuranceCompany: row.insurance_company as InsuranceCompany,
    insuranceNumber: decrypted.insurance_number_encrypted || undefined,
    medicalConditions: medicalConditions?.length ? medicalConditions : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getClients(
  userId: string,
  options?: { search?: string; insuranceCompany?: string }
): Promise<ClientDecrypted[]> {
  let query = supabaseAdmin
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options?.insuranceCompany) {
    query = query.eq('insurance_company', options.insuranceCompany);
  }

  const { data: rows, error } = await query;

  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const key = await getEncryptionKey(userId);
  const clients: ClientDecrypted[] = [];

  for (const row of rows) {
    const encrypted: Record<string, string | null> = {};
    for (const field of ENCRYPTED_FIELDS) {
      const val = row[field];
      if (val) encrypted[field] = val as string;
    }
    const decrypted = decryptFields(encrypted, key);
    clients.push(mapDbToClient(row, decrypted));
  }

  if (options?.search) {
    const search = options.search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.email?.toLowerCase().includes(search) ?? false) ||
        (c.insuranceNumber?.includes(search) ?? false)
    );
  }

  return clients;
}

export async function getClientById(userId: string, clientId: string): Promise<ClientDecrypted | null> {
  const { data: row, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !row) return null;

  const key = await getEncryptionKey(userId);
  const encrypted: Record<string, string | null> = {};
  for (const field of ENCRYPTED_FIELDS) {
    const val = row[field];
    if (val) encrypted[field] = val as string;
  }
  const decrypted = decryptFields(encrypted, key);
  return mapDbToClient(row, decrypted);
}

export async function createClient(userId: string, request: CreateClientRequest): Promise<ClientDecrypted> {
  const key = await getEncryptionKey(userId);

  const encrypted = encryptFields(
    {
      name_encrypted: request.name,
      email_encrypted: request.email,
      phone_encrypted: request.phone,
      date_of_birth_encrypted: request.dateOfBirth,
      notes_encrypted: request.notes,
      insurance_number_encrypted: request.insuranceNumber,
      medical_conditions_encrypted: request.medicalConditions?.length
        ? JSON.stringify(request.medicalConditions)
        : undefined,
    },
    key
  );

  const { data: row, error } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name_encrypted: encrypted.name_encrypted,
      email_encrypted: encrypted.email_encrypted || null,
      phone_encrypted: encrypted.phone_encrypted || null,
      date_of_birth_encrypted: encrypted.date_of_birth_encrypted || null,
      notes_encrypted: encrypted.notes_encrypted || null,
      insurance_company: request.insuranceCompany,
      insurance_number_encrypted: encrypted.insurance_number_encrypted || null,
      medical_conditions_encrypted: encrypted.medical_conditions_encrypted || null,
      import_source: request.importSource || 'manual',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const decrypted = decryptFields(
    {
      name_encrypted: row.name_encrypted,
      email_encrypted: row.email_encrypted,
      phone_encrypted: row.phone_encrypted,
      date_of_birth_encrypted: row.date_of_birth_encrypted,
      notes_encrypted: row.notes_encrypted,
      insurance_number_encrypted: row.insurance_number_encrypted,
      medical_conditions_encrypted: row.medical_conditions_encrypted,
    },
    key
  );
  return mapDbToClient(row, decrypted);
}

export async function updateClient(
  userId: string,
  clientId: string,
  request: Partial<CreateClientRequest>
): Promise<ClientDecrypted | null> {
  const key = await getEncryptionKey(userId);

  const updates: Record<string, unknown> = {
    insurance_company: request.insuranceCompany,
  };

  if (request.name !== undefined)
    updates.name_encrypted = request.name ? encrypt(request.name, key) : null;
  if (request.email !== undefined)
    updates.email_encrypted = request.email ? encrypt(request.email, key) : null;
  if (request.phone !== undefined)
    updates.phone_encrypted = request.phone ? encrypt(request.phone, key) : null;
  if (request.dateOfBirth !== undefined)
    updates.date_of_birth_encrypted = request.dateOfBirth ? encrypt(request.dateOfBirth, key) : null;
  if (request.notes !== undefined)
    updates.notes_encrypted = request.notes ? encrypt(request.notes, key) : null;
  if (request.insuranceNumber !== undefined)
    updates.insurance_number_encrypted = request.insuranceNumber ? encrypt(request.insuranceNumber, key) : null;
  if (request.medicalConditions !== undefined)
    updates.medical_conditions_encrypted = request.medicalConditions?.length
      ? encrypt(JSON.stringify(request.medicalConditions), key)
      : null;

  const { data: row, error } = await supabaseAdmin
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !row) return null;

  const decrypted = decryptFields(
    {
      name_encrypted: row.name_encrypted,
      email_encrypted: row.email_encrypted,
      phone_encrypted: row.phone_encrypted,
      date_of_birth_encrypted: row.date_of_birth_encrypted,
      notes_encrypted: row.notes_encrypted,
      insurance_number_encrypted: row.insurance_number_encrypted,
      medical_conditions_encrypted: row.medical_conditions_encrypted,
    },
    key
  );
  return mapDbToClient(row, decrypted);
}

export async function deleteClient(userId: string, clientId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('user_id', userId);

  return !error;
}
