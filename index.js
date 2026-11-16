// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  RAGE-Bot — Entry Point (index.js) v7.0.0                                    ║
// ║  ✅ Worker fork | ✅ Hot Reload (chokidar) | ✅ RAM Monitor | ✅ Express       ║
// ║  Author: RAGE                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

console.log('🔥 Starting RAGE-Bot entry point...');

import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import express from 'express';
import chalk from 'chalk';
import os from 'os';
import { promises as fsp } from 'fs';
import chokidar from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

// ── BANNER ────────────────────────────────────────────────────────────────────
say('RAGE', { font: 'block', align: 'center', gradient: ['red', 'yellow'], transitionGradient: true });
say('RAGE-Bot v7.0.0 | By RAGE', { font: 'console', align: 'center', gradient: ['red', 'magenta'] });

// ── EXPRESS KEEP-ALIVE ────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (_, res) => res.send('🔥 RAGE-Bot is running ✅'));
app.get('/status', (_, res) => {
  const total = os.totalmem(), free = os.freemem();
  res.json({
    bot: 'RAGE-Bot', status: 'online', uptime: process.uptime(),
    ram: {
      total: (total / 1024 ** 3).toFixed(2) + ' GB',
      free: (free / 1024 ** 3).toFixed(2) + ' GB',
      used: ((total - free) / 1024 ** 3).toFixed(2) + ' GB',
      percent: (((total - free) / total) * 100).toFixed(1) + '%',
    },
  });
});
app.listen(port, () => console.log(chalk.green(`🌐 Port ${port} is open`)));

// ── CONTROL ───────────────────────────────────────────────────────────────────
let isRunning = false;
let isRestarting = false;
let workerProcess = null;
let restartTimeout = null;

// ── WATCH PATHS ───────────────────────────────────────────────────────────────
const WATCH_PATHS = [
  join(__dirname, 'plugins'),
  join(__dirname, 'lib'),
  join(__dirname, 'utils'),
  join(__dirname, 'src'),
  join(__dirname, 'handlers'),
  join(__dirname, 'config.js'),
  join(__dirname, 'settings.js'),
  join(__dirname, 'handler.js'),
  join(__dirname, 'main.js'),
];

// ── RESTART ───────────────────────────────────────────────────────────────────
function scheduleRestart(reason = 'file changed', delay = 2000) {
  if (isRestarting || !workerProcess) return;
  if (restartTimeout) clearTimeout(restartTimeout);
  console.log(chalk.yellow(`🔄 ${reason} — restart in ${delay}ms`));
  isRestarting = true;
  restartTimeout = setTimeout(() => {
    restartTimeout = null;
    if (workerProcess) {
      console.log(chalk.cyan('♻️ Sending SIGTERM to worker...'));
      workerProcess.kill('SIGTERM');
    } else {
      isRestarting = false;
      start('main.js');
    }
  }, delay);
}

// ── WATCHER ───────────────────────────────────────────────────────────────────
function startGlobalWatcher() {
  const watcher = chokidar.watch(WATCH_PATHS, {
    persistent: true, ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 800, pollInterval: 200 },
  });
  watcher.on('change', f => scheduleRestart(`changed: ${f.replace(__dirname, '.')}`, 1500));
  watcher.on('add',    f => scheduleRestart(`new: ${f.replace(__dirname, '.')}`, 1500));
  watcher.on('unlink', f => scheduleRestart(`deleted: ${f.replace(__dirname, '.')}`, 1500));
  console.log(chalk.magenta('👁️  Full Hot Reload active (1.5s debounce)'));
}

// ── START WORKER ──────────────────────────────────────────────────────────────
async function start(file) {
  if (isRunning) return console.log(chalk.yellow('⚠️  Worker already running'));
  isRunning = true;

  const workerPath = join(__dirname, file);
  try {
    await fsp.access(workerPath, fsp.constants.F_OK);
  } catch {
    console.error(chalk.red(`❌ Worker "${workerPath}" does not exist!`));
    isRunning = false;
    return setTimeout(() => start(file), 10000);
  }

  console.log(chalk.green(`🚀 Launching: ${workerPath}`));

  const child = fork(workerPath, process.argv.slice(2), { stdio: 'inherit', env: process.env });
  workerProcess = child;

  child.on('message', (data) => {
    if (data === 'reset') scheduleRestart('worker reset', 1000);
    else if (data === 'uptime') child.send(process.uptime());
    else console.log('[WORKER MSG]', data);
  });

  child.on('error', (err) => console.error(chalk.red('💥 Worker error:'), err));

  child.on('exit', (code, signal) => {
    isRunning = false;
    workerProcess = null;
    if (restartTimeout) { clearTimeout(restartTimeout); restartTimeout = null; }

    if (isRestarting) {
      console.log(chalk.cyan('♻️  Restarting worker (intentional)'));
      isRestarting = false;
      return setTimeout(() => start(file), 1200);
    }

    if (code === 0) {
      console.log(chalk.yellow('⚠️  Worker exited cleanly (code 0) — no auto-restart'));
      return process.exit(0);
    }

    console.error(chalk.red(`❌ Worker exited: code=${code} signal=${signal || 'none'}`));
    console.log(chalk.yellow('🔄 Restarting in 8s...'));
    setTimeout(() => start(file), 8000);
  });

  // ── SYS INFO ────────────────────────────────────────────────────────────────
  console.log(chalk.yellow(`🖥️  ${os.type()}, ${os.release()} - ${os.arch()}`));

  try {
    const pkg = JSON.parse(await fsp.readFile('./package.json', 'utf-8'));
    console.log(chalk.blue.bold('\n📦 Package'));
    console.log(chalk.cyan(`  Name    : ${pkg.name}`));
    console.log(chalk.cyan(`  Version : ${pkg.version}`));
    console.log(chalk.cyan(`  Author  : ${pkg.author || 'RAGE'}`));
  } catch { console.error(chalk.red('❌ Could not read package.json')); }

  console.log(chalk.blue.bold('\n⏰ Current Time'));
  console.log(chalk.cyan(new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })));

  // ── Terminal input ─────────────────────────────────────────────────────────
  if (!rl.listenerCount('line')) {
    rl.on('line', (line) => { if (child.connected) child.send(line.trim()); });
  }

  setInterval(() => {}, 60000);
}

// ── GO ────────────────────────────────────────────────────────────────────────
startGlobalWatcher();
start('main.js').catch(err => {
  console.error(chalk.red('💥 Fatal:'), err);
  setTimeout(() => start('main.js'), 10000);
});