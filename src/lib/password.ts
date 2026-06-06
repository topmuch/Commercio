import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plaintext password using bcrypt.
 * Always use this when creating or updating user passwords.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS)
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Returns true if the password matches.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash)
}

/**
 * Check if a password hash is a plaintext legacy password
 * (i.e., does NOT start with $2a$, $2b$, or $2y$).
 * Used for transparent migration from plaintext to bcrypt.
 */
export function isLegacyPlaintextPassword(password: string): boolean {
  // bcrypt hashes always start with $2a$, $2b$, or $2y$
  return !password.startsWith('$2')
}

/**
 * Verify a password that might be either plaintext (legacy) or bcrypt hash.
 * If plaintext is detected, the caller should re-hash it.
 * Returns { valid, needsRehash }.
 */
export async function verifyPassword(
  plainText: string,
  storedPassword: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (isLegacyPlaintextPassword(storedPassword)) {
    // Legacy plaintext comparison — needs rehash
    return { valid: plainText === storedPassword, needsRehash: true }
  }
  // bcrypt comparison
  const valid = await bcrypt.compare(plainText, storedPassword)
  return { valid, needsRehash: false }
}
