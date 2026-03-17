// ═══════════════════════════════════════════════════
//   start.js — Unified Entry Point untuk Railway
//   Menjalankan bot (index.js) + dashboard (web.js)
//   dalam satu proses Railway service
// ═══════════════════════════════════════════════════

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLOR = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
};

const log = (prefix, color, msg) => {
  const time = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`${COLOR.gray}[${time}]${COLOR.reset} ${color}[${prefix}]${COLOR.reset} ${msg}`);
};

// ─── Validasi env vars wajib ──────────────────────
if (!process.env.PHONE_NUMBER) {
  console.error(`\n${COLOR.red}❌ ERROR: Env variable PHONE_NUMBER belum di-set!${COLOR.reset}`);
  console.error(`   Tambahkan di Railway → Variables:`);
  console.error(`   PHONE_NUMBER=628xxxxxxxxxx\n`);
  process.exit(1);
}

console.log(`\n╔═══════════════════════════════════════════╗`);
console.log(`║   🏙️  Hallo Johor — Starting Services      ║`);
console.log(`╚═══════════════════════════════════════════╝\n`);

// ─── Spawn child process ──────────────────────────
const spawnService = (name, file, color) => {
  const child = spawn('node', [path.join(__dirname, file)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => {
      if (line.trim()) process.stdout.write(`${color}[${name}]${COLOR.reset} ${line}\n`);
    });
  });

  child.stderr.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => {
      if (line.trim()) process.stderr.write(`${COLOR.red}[${name}]${COLOR.reset} ${line}\n`);
    });
  });

  child.on('exit', (code) => {
    log(name, COLOR.red, `Proses berhenti (exit code: ${code}). Restart dalam 5 detik...`);
    setTimeout(() => spawnService(name, file, color), 5000);
  });

  child.on('error', (err) => {
    log(name, COLOR.red, `Error: ${err.message}`);
  });

  log(name, color, `✅ Proses dimulai (PID: ${child.pid})`);
  return child;
};

// ─── Jalankan kedua service ───────────────────────
const bot = spawnService('BOT', 'index.js', COLOR.cyan);
const web = spawnService('WEB', 'web.js',   COLOR.green);

// ─── Graceful shutdown ────────────────────────────
const shutdown = (signal) => {
  log('SYSTEM', COLOR.yellow, `Menerima ${signal}. Menghentikan semua service...`);
  bot.kill('SIGTERM');
  web.kill('SIGTERM');
  setTimeout(() => process.exit(0), 3000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
