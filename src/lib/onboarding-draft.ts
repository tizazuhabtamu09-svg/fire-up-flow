import type { RegistrationValues, RegistrationFiles } from "@/components/RegistrationForm";
import type { OnboardingRole } from "@/lib/onboarding";

/**
 * Draft of the multi-step public sign-up wizard.
 *
 * Step 1 (role picker) and step 2 (role form) run before the visitor has an
 * account, so their answers are cached locally until step 3 (credentials)
 * creates the user. Text values live in localStorage; the uploaded files live
 * in IndexedDB, which is the only client store that survives a full-page
 * Google OAuth redirect while keeping binary data intact.
 */

const DRAFT_KEY = "agaze:onboarding-draft";
const DB_NAME = "agaze-onboarding";
const STORE = "files";

export type OnboardingDraft = {
  role: OnboardingRole;
  values: RegistrationValues;
  savedAt: number;
};

export function saveDraftValues(role: OnboardingRole, values: RegistrationValues) {
  if (typeof window === "undefined") return;
  const draft: OnboardingDraft = { role, values, savedAt: Date.now() };
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (!parsed?.role || !parsed?.values) return null;
    // Drafts older than a day are stale.
    if (Date.now() - (parsed.savedAt ?? 0) > 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

const FILE_KEYS: (keyof RegistrationFiles)[] = ["photo", "idFront", "idBack", "contract", "guarantorId", "guarantorPhoto"];

export async function saveDraftFiles(files: RegistrationFiles) {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const key of FILE_KEYS) {
      const file = files[key];
      if (file) store.put(file, key);
      else store.delete(key);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function loadDraftFiles(): Promise<RegistrationFiles> {
  const empty: RegistrationFiles = { photo: null, idFront: null, idBack: null, contract: null, guarantorId: null, guarantorPhoto: null };
  const db = await openDb();
  if (!db) return empty;
  const result = await new Promise<RegistrationFiles>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const out: RegistrationFiles = { ...empty };
    for (const key of FILE_KEYS) {
      const req = store.get(key);
      req.onsuccess = () => {
        const value = req.result;
        if (value instanceof File) out[key] = value;
        else if (value instanceof Blob) out[key] = new File([value], key);
      };
    }
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => resolve(out);
  });
  db.close();
  return result;
}

export async function clearDraft() {
  if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    for (const key of FILE_KEYS) tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

/** Required uploads per role, mirrored from the submit handlers. */
export function missingRequiredFiles(role: OnboardingRole, files: RegistrationFiles): string | null {
  if ((role === "employee" || role === "broker") && (!files.idFront || !files.idBack)) {
    return "Please upload both sides of your Fayda ID.";
  }
  return null;
}
