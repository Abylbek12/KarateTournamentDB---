// Temporary: shows where the build put its files on Vercel.
import fs from 'fs';
import path from 'path';
const cwd = process.cwd();
console.log('[diag] cwd =', cwd, 'node', process.version);
console.log('[diag] root entries:', fs.readdirSync(cwd).join(', '));
for (const d of ['dist', 'public', '.vercel/output']) {
  const p = path.join(cwd, d);
  console.log(`[diag] ${d}:`, fs.existsSync(p) ? fs.readdirSync(p).join(', ') : 'MISSING');
}
