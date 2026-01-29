// lib/wallet/storage.ts

const STORAGE_KEY = "worplink_encrypted_mnemonic";

export function hasEncryptedSeed(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function saveEncryptedSeed(encrypted: string) {
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export async function loadEncryptedSeed(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEY);
}

export async function clearEncryptedSeed() {
  localStorage.removeItem(STORAGE_KEY);
}

