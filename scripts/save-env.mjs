import {readFile, writeFile} from 'node:fs/promises';

// Update one setting in place; collapse previous copies without touching other keys.
export async function saveEnv(name, value, path = '.env.local') {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || /[\r\n]/.test(String(value))) {
    throw new Error('Invalid environment setting');
  }
  const source = await readFile(path, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`);
  let found = false;
  const lines = source.split(/\r?\n/).filter(line => {
    if (!pattern.test(line)) return true;
    if (found) return false;
    found = true;
    return true;
  }).map(line => pattern.test(line) ? `${name}=${value}` : line);
  if (!found) {
    if (lines.at(-1) === '') lines.pop();
    lines.push(`${name}=${value}`, '');
  }
  const updated = lines.join(newline);
  if (updated !== source) await writeFile(path, updated, {mode: 0o600});
}
