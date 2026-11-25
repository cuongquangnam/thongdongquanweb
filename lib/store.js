import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { get, put } from '@vercel/blob';
import { normalizeStore } from './calendar.js';
import { defaultInventory } from './rooms.js';

const BLOB_PATH = 'thongdongquan/store.json';
const FILE_PATH = path.join(process.cwd(), '.data', 'store.json');

export function emptyStore() {
  return {
    inventory: defaultInventory(),
    bookings: {},
    calendar: {},
    lastImportAt: null,
  };
}

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readFileStore() {
  try {
    return JSON.parse(await readFile(FILE_PATH, 'utf8'));
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(store) {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(store));
}

export async function readStore() {
  if (!useBlob()) {
    if (process.env.VERCEL) {
      throw new Error('Connect a Vercel Blob store to this project before saving bookings.');
    }
    return normalizeStore(await readFileStore());
  }
  const result = await get(BLOB_PATH, { access: 'private' });
  if (!result || !result.stream) return emptyStore();
  const text = await new Response(result.stream).text();
  return normalizeStore(JSON.parse(text));
}

export async function writeStore(store) {
  const body = JSON.stringify(store);
  if (!useBlob()) {
    if (process.env.VERCEL) {
      throw new Error('Connect a Vercel Blob store to this project before saving bookings.');
    }
    await writeFileStore(store);
    return;
  }
  await put(BLOB_PATH, body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

let queue = Promise.resolve();

export function updateStore(mutator) {
  const run = queue.then(async () => {
    const store = await readStore();
    const next = normalizeStore(await mutator(store));
    await writeStore(next);
    return next;
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
}
