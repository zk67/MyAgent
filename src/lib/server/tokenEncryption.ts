import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

function getEncryptionKey() {
  const encodedKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured.');
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }

  return key;
}

export function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encodedIv = iv.toString('base64url');
  const encodedAuthTag = authTag.toString('base64url');
  const encodedValue = encrypted.toString('base64url');

  return `${VERSION}.${encodedIv}.${encodedAuthTag}.${encodedValue}`;
}

export function decryptToken(payload: string) {
  const parts = payload.split('.');
  const version = parts[0];
  const encodedIv = parts[1];
  const encodedAuthTag = parts[2];
  const encodedValue = parts[3];

  if (version !== VERSION || !encodedIv || !encodedAuthTag || !encodedValue) {
    throw new Error('Stored token has an invalid encrypted format.');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encodedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
