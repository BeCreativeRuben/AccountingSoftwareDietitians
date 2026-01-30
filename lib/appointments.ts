import { supabaseAdmin } from './supabase/server';
import { getEncryptionKeySalt } from './auth';
import { decrypt, encrypt, deriveServerEncryptionKey } from './encryption';
import type {
  AppointmentDecrypted,
  AppointmentType,
  CreateAppointmentRequest,
  AppointmentStatus,
} from './types';

async function getEncryptionKey(userId: string): Promise<Uint8Array> {
  const salt = await getEncryptionKeySalt(userId);
  if (!salt) throw new Error('User encryption salt not found');
  return deriveServerEncryptionKey(userId, salt);
}

export async function getAppointments(
  userId: string,
  options?: { start?: Date; end?: Date; clientId?: string }
): Promise<AppointmentDecrypted[]> {
  let query = supabaseAdmin
    .from('appointments')
    .select('*, appointment_type:appointment_type_id(*)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('start_time', { ascending: true });

  if (options?.start) {
    query = query.gte('start_time', options.start.toISOString());
  }
  if (options?.end) {
    query = query.lte('end_time', options.end.toISOString());
  }
  if (options?.clientId) {
    query = query.ilike('client_ids_json', `%${options.clientId}%`);
  }

  const { data: rows, error } = await query;

  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const key = await getEncryptionKey(userId);
  const result: AppointmentDecrypted[] = [];

  for (const row of rows) {
    const typeRow = Array.isArray(row.appointment_type) ? row.appointment_type[0] : row.appointment_type;
    const appointmentType: AppointmentType = typeRow
      ? {
          id: typeRow.id,
          userId: typeRow.user_id,
          name: typeRow.name,
          price: Number(typeRow.price),
          durationMinutes: typeRow.duration_minutes ?? 60,
          isCustom: typeRow.is_custom ?? true,
          createdAt: new Date(typeRow.created_at),
          updatedAt: new Date(typeRow.updated_at),
        }
      : ({} as AppointmentType);

    let notes: string | undefined;
    if (row.notes_encrypted) {
      try {
        notes = decrypt(row.notes_encrypted, key);
      } catch {
        notes = undefined;
      }
    }

    result.push({
      id: row.id,
      userId: row.user_id,
      appointmentType,
      clientIds: JSON.parse(row.client_ids_json || '[]'),
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      status: row.status as AppointmentStatus,
      notes,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
    });
  }

  return result;
}

export async function getAppointmentById(userId: string, appointmentId: string): Promise<AppointmentDecrypted | null> {
  const { data: row, error } = await supabaseAdmin
    .from('appointments')
    .select('*, appointment_type:appointment_type_id(*)')
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !row) return null;

  const typeRow = Array.isArray(row.appointment_type) ? row.appointment_type[0] : row.appointment_type;
  const appointmentType: AppointmentType = typeRow
    ? {
        id: typeRow.id,
        userId: typeRow.user_id,
        name: typeRow.name,
        price: Number(typeRow.price),
        durationMinutes: typeRow.duration_minutes ?? 60,
        isCustom: typeRow.is_custom ?? true,
        createdAt: new Date(typeRow.created_at),
        updatedAt: new Date(typeRow.updated_at),
      }
    : ({} as AppointmentType);

  const key = await getEncryptionKey(userId);
  let notes: string | undefined;
  if (row.notes_encrypted) {
    try {
      notes = decrypt(row.notes_encrypted, key);
    } catch {
      notes = undefined;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    appointmentType,
    clientIds: JSON.parse(row.client_ids_json || '[]'),
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    status: row.status as AppointmentStatus,
    notes,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function createAppointment(userId: string, request: CreateAppointmentRequest): Promise<AppointmentDecrypted> {
  const key = await getEncryptionKey(userId);
  const notesEncrypted = request.notes ? encrypt(request.notes, key) : null;

  const { data: row, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      user_id: userId,
      appointment_type_id: request.appointmentTypeId,
      client_ids_json: JSON.stringify(request.clientIds),
      start_time: request.startTime,
      end_time: request.endTime,
      status: 'scheduled',
      notes_encrypted: notesEncrypted,
    })
    .select('*, appointment_type:appointment_type_id(*)')
    .single();

  if (error) throw new Error(error.message);

  const typeRow = Array.isArray(row.appointment_type) ? row.appointment_type[0] : row.appointment_type;
  const appointmentType: AppointmentType = typeRow
    ? {
        id: typeRow.id,
        userId: typeRow.user_id,
        name: typeRow.name,
        price: Number(typeRow.price),
        durationMinutes: typeRow.duration_minutes ?? 60,
        isCustom: typeRow.is_custom ?? true,
        createdAt: new Date(typeRow.created_at),
        updatedAt: new Date(typeRow.updated_at),
      }
    : ({} as AppointmentType);

  return {
    id: row.id,
    userId: row.user_id,
    appointmentType,
    clientIds: JSON.parse(row.client_ids_json || '[]'),
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    status: 'scheduled' as AppointmentStatus,
    notes: request.notes,
    createdAt: new Date(row.created_at),
  };
}

export async function updateAppointment(
  userId: string,
  appointmentId: string,
  updates: Partial<{
    appointmentTypeId: string;
    clientIds: string[];
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    notes: string;
  }>
): Promise<AppointmentDecrypted | null> {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.appointmentTypeId) dbUpdates.appointment_type_id = updates.appointmentTypeId;
  if (updates.clientIds) dbUpdates.client_ids_json = JSON.stringify(updates.clientIds);
  if (updates.startTime) dbUpdates.start_time = updates.startTime;
  if (updates.endTime) dbUpdates.end_time = updates.endTime;
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
    if (updates.status === 'completed') {
      dbUpdates.completed_at = new Date().toISOString();
    } else {
      dbUpdates.completed_at = null;
    }
  }
  if (updates.notes !== undefined) {
    const key = await getEncryptionKey(userId);
    dbUpdates.notes_encrypted = updates.notes ? encrypt(updates.notes, key) : null;
  }

  const { data: row, error } = await supabaseAdmin
    .from('appointments')
    .update(dbUpdates)
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .select('*, appointment_type:appointment_type_id(*)')
    .single();

  if (error || !row) return null;

  const typeRow = Array.isArray(row.appointment_type) ? row.appointment_type[0] : row.appointment_type;
  const appointmentType: AppointmentType = typeRow
    ? {
        id: typeRow.id,
        userId: typeRow.user_id,
        name: typeRow.name,
        price: Number(typeRow.price),
        durationMinutes: typeRow.duration_minutes ?? 60,
        isCustom: typeRow.is_custom ?? true,
        createdAt: new Date(typeRow.created_at),
        updatedAt: new Date(typeRow.updated_at),
      }
    : ({} as AppointmentType);

  const key = await getEncryptionKey(userId);
  let notes: string | undefined;
  if (row.notes_encrypted) {
    try {
      notes = decrypt(row.notes_encrypted, key);
    } catch {
      notes = undefined;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    appointmentType,
    clientIds: JSON.parse(row.client_ids_json || '[]'),
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    status: row.status as AppointmentStatus,
    notes,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function deleteAppointment(userId: string, appointmentId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('user_id', userId);

  return !error;
}
