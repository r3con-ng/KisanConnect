import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public', 'legacy');

await mkdir(destination, { recursive: true });
await Promise.all(['data', 'js'].map((folder) =>
  cp(path.join(root, folder), path.join(destination, folder), { recursive: true, force: true }),
));
