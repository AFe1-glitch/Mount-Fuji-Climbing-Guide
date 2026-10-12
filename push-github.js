#!/usr/bin/env node
/**
 * Push the fuji-climb site to a GitHub repo via the Contents API.
 * Reads PAT from env var GITHUB_TOKEN (never hardcoded).
 */
import fs from 'node:fs';
import path from 'node:path';

const OWNER = 'AFe1-glitch';
const REPO = 'Mount-Fuji-Climbing-Guide';
const ROOT = '/data/user/0/com.dsh.android/files/workspace/deepseek-harness/default-workspace/fuji-climb';
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

async function api(method, url, body, token) {
  const opts = {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'fuji-push',
      'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

// Collect files, excluding server.js and hidden files
const files = [];
function walk(dir, prefix) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else if (name !== 'server.js') files.push({ full, rel });
  }
}
walk(ROOT, '');

// Ensure directories exist (css/js/img) so the first commit has them
const dirs = new Set();
files.forEach(f => {
  const parts = f.rel.split('/');
  if (parts.length > 1) dirs.add(parts.slice(0, -1).join('/'));
});

let branch = 'main';
const token = process.env.GITHUB_TOKEN;

// Create placeholder dirs first (empty dirs aren't allowed, so put a .gitkeep)
for (const d of dirs) {
  const keep = `${d}/.gitkeep`;
  try {
    await api('PUT', `${BASE}/${keep}`, {
      message: `add ${d}/.gitkeep`,
      content: '',
      encoding: 'utf-8',
      branch,
    }, token);
    branch = 'main';
  } catch (e) {
    // 409 = already exists, ignore
    if (!/409|already exists/i.test(String(e.message))) throw e;
  }
}

// Upload each file
for (const f of files) {
  const buf = fs.readFileSync(f.full);
  const b64 = buf.toString('base64');
  const size = buf.length;
  console.log(`uploading ${f.rel} (${size} bytes)`);
  const res = await api('PUT', `${BASE}/${f.rel}`, {
    message: `add ${f.rel}`,
    content: b64,
    encoding: 'base64',
    branch,
  }, token);
  branch = res.commit ? 'main' : branch;
}

console.log('\nDone. Enable GitHub Pages on this repo: Settings → Pages → Deploy from branch → main / root');
console.log(`Site URL (after enabling): https://${OWNER}.github.io/${REPO}/`);
