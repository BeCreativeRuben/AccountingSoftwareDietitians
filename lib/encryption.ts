import nacl from 'tweetnacl';
import { pbkdf2Sync } from 'crypto';

/**
 * Encryption utilities for sensitive data
 * Uses TweetNaCl (NaCl SecretBox) for encryption
 * Key derivation uses PBKDF2 with 100k iterations
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const NONCE_LENGTH = 24;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from password and salt
 */
export function deriveEncryptionKey(password: string, salt: string): Uint8Array {
  const saltBuffer = Buffer.from(salt, 'hex');
  const key = pbkdf2Sync(
    password,
    saltBuffer,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  return new Uint8Array(key);
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  const salt = nacl.randomBytes(SALT_LENGTH);
  return Buffer.from(salt).toString('hex');
}

/**
 * Encrypt a string value
 */
export function encrypt(plaintext: string, encryptionKey: Uint8Array): string {
  if (!plaintext) return '';
  
  const message = new TextEncoder().encode(plaintext);
  const nonce = nacl.randomBytes(NONCE_LENGTH);
  const box = nacl.secretbox(message, nonce, encryptionKey);
  
  // Combine nonce + encrypted data
  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);
  
  // Return as base64 string
  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt a string value
 */
export function decrypt(encrypted: string, encryptionKey: Uint8Array): string {
  if (!encrypted) return '';
  
  try {
    const combined = Buffer.from(encrypted, 'base64');
    const nonce = combined.slice(0, NONCE_LENGTH);
    const box = combined.slice(NONCE_LENGTH);
    
    const decrypted = nacl.secretbox.open(box, nonce, encryptionKey);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error(`Decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt multiple fields at once
 */
export function encryptFields(
  fields: Record<string, string | undefined>,
  encryptionKey: Uint8Array
): Record<string, string> {
  const encrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      encrypted[key] = encrypt(value, encryptionKey);
    }
  }
  
  return encrypted;
}

/**
 * Derive server-side encryption key for a user
 * Uses ENCRYPTION_SECRET + userId + salt (for MVP - avoids needing user password on each request)
 */
export function deriveServerEncryptionKey(
  userId: string,
  salt: string,
  secret: string = process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-dev-secret'
): Uint8Array {
  const combined = `${secret}:${userId}:${salt}`;
  const saltBuffer = Buffer.from(salt, 'hex').length >= 16 
    ? Buffer.from(salt, 'hex') 
    : Buffer.from(salt.padEnd(32, '0').slice(0, 32));
  const key = pbkdf2Sync(
    combined,
    saltBuffer,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  return new Uint8Array(key);
}

/**
 * Decrypt multiple fields at once
 */
export function decryptFields(
  encryptedFields: Record<string, string | null | undefined>,
  encryptionKey: Uint8Array
): Record<string, string> {
  const decrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(encryptedFields)) {
    if (value) {
      try {
        decrypted[key] = decrypt(value, encryptionKey);
      } catch (error) {
        console.error(`Failed to decrypt field ${key}:`, error);
        decrypted[key] = '';
      }
    }
  }
  
  return decrypted;
}
