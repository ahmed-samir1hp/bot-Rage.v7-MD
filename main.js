// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  RAGE-Bot — main.js v7.0.1                                                   ║
// ║  Baileys | Custom Pairing Code | Socket Patches | RAM Monitor                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import * as baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import readline from 'readline';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import lodash from 'lodash';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import os from 'os';

// ── Baileys ───────────────────────────────────────────────────────────────────
const makeWASocket =
  typeof baileys.makeWASocket === 'function'
    ? baileys.makeWASocket
    : typeof baileys.default?.makeWASocket === 'function'
      ? baileys.default.makeWASocket
      : typeof baileys.default?.default === 'function'
        ? baileys.default.default
        : typeof baileys.default === 'function'
          ? baileys.default
          : null;

const useMultiFileAuthState = baileys.useMultiFileAuthState;
const DisconnectReason = baileys.DisconnectReason;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
const Browsers = baileys.Browsers || baileys.default?.Browsers;

const fetchLatestBaileysVersion =
  baileys.fetchLatestBaileysVersion ||
  baileys.default?.fetchLatestBaileysVersion ||
  (async () => ({ version: [2, 3000, 1015901307] }));

const jidNormalizedUser = baileys.jidNormalizedUser;

if (
  typeof makeWASocket !== 'function' ||
  typeof useMultiFileAuthState !== 'function' ||
  typeof makeCacheableSignalKeyStore !== 'function'
) {
  throw new Error(
    'Baileys exports are missing or incompatible. Check your installed version.'
  );
}

const { chain } = lodash;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── LOGGER ────────────────────────────────────────────────────────────────────
const pinoLogger = pino.default
  ? pino.default({ level: 'silent' })
  : pino({ level: 'silent' });

// ── STORE ─────────────────────────────────────────────────────────────────────
const store = {
  messages: {},
  contacts: {},

  bind: (ev) => {
    ev.on('contacts.upsert', (contacts) => {
      for (const c of contacts || []) if (c?.id) store.contacts[c.id] = c;
    });
    ev.on('contacts.update', (updates) => {
      for (const c of updates || []) {
        if (c?.id) store.contacts[c.id] = { ...(store.contacts[c.id] || {}), ...c };
      }
    });

    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages || []) {
        const jid = msg.key?.remoteJid;
        if (!jid) continue;

        if (!store.messages[jid]) store.messages[jid] = [];
        store.messages[jid].push(msg);

        if (store.messages[jid].length > 100) {
          store.messages[jid].shift();
        }
      }
    });
  },

  loadMessage: async (jid, id) => {
    if (jid === null) {
      for (const j of Object.keys(store.messages)) {
        const found = store.messages[j].find((m) => m.key.id === id);
        if (found) return found;
      }
      return null;
    }

    return store.messages[jid]?.find((m) => m.key.id === id) || null;
  },
};

// ── DIRECTORIES ───────────────────────────────────────────────────────────────
const SESSION_DIR = path.resolve('./sessions');

await fs.ensureDir(SESSION_DIR);
await fs.ensureDir('./tmp');
await fs.ensureDir('./plugins');

// ── DATABASE ──────────────────────────────────────────────────────────────────
const opts = new Object(
  yargs(hideBin(process.argv)).exitProcess(false).parse()
);

global.opts = opts;

global.db = new Low(
  new JSONFile('database.json'),
  { users: {}, chats: {}, settings: {}, stats: {} }
);

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;

  global.db.READ = true;

  try {
    await global.db.read();
  } catch (error) {
    console.error('Database read error:', error);
  }

  global.db.READ = null;

  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };

  global.db.chain = chain(global.db.data);
};

await global.loadDatabase();

// ══════════════════════════════════════════════════════════════════════════════
// GLOBALS
// ══════════════════════════════════════════════════════════════════════════════
global.owner = Array.isArray(global.owner) ? global.owner : [];
if (!global.owner.some((o) => String(Array.isArray(o) ? o[0] : o) === '201221579275')) {
  global.owner.unshift(['201221579275', 'RAGE', true]);
}
global.mods = global.mods || [];
global.prems = global.prems || [];

global.gt = global.gt || 'RAGE';
global.gataImg = global.gataImg || 'https://files.catbox.moe/5uli5p.jpg';
global.accountsgb = global.accountsgb || 'https://github.com/rage-bot';
global.wm = global.wm || 'RAGE';
global.ig = global.ig || 'https://instagram.com/rage';
global.asistencia = global.asistencia || 'https://wa.me/201221579275';
global.channel = global.channel || 'https://whatsapp.com/channel/xxxxxxxx';
global.saludo = global.saludo || 'أهلاً بك';
global.nombre = global.nombre || 'RAGE-Bot';
global.dev = global.dev || 'RAGE';
global.random1 = global.random1 || (() => 'https://files.catbox.moe/5uli5p.jpg');

global.mid = global.mid || {
  mAdvertencia: '⚠️ *تحذير*',
  mFake2: (user) =>
    `@${String(user).split('@')[0]} أنت رقم وهمي، سيتم الطرد`,
};

global.lenguajeGB =
  global.lenguajeGB ||
  new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (!(prop in target)) target[prop] = () => '';
      return target[prop];
    },
  });

// ══════════════════════════════════════════════════════════════════════════════
// SOCKET PATCHES
// ══════════════════════════════════════════════════════════════════════════════
let smsgFn = null;
let simpleMod = null;

try {
  simpleMod = await import('./lib/simple.js');
  smsgFn = simpleMod.smsg || null;

  // بدونهم m.chat / m.sender / m.react مش بتتعرف
  if (typeof simpleMod.protoType === 'function') simpleMod.protoType();
  if (typeof simpleMod.serialize === 'function') simpleMod.serialize();

  if (!smsgFn) {
    console.warn(chalk.yellow('simple.js does not provide smsg. Using fallback.'));
  }
} catch (error) {
  console.warn(chalk.yellow(`Cannot import lib/simple.js: ${error.message}`));
}

function patchSock(sock) {
  sock.decodeJid = (jid) => {
    if (!jid) return jid;

    if (/:\d+@/gi.test(jid)) {
      try {
        return jidNormalizedUser(jid);
      } catch {
        return jid;
      }
    }

    return jid;
  };

  sock.reply = (jid, text, quoted, options = {}) =>
    sock.sendMessage(jid, { text, ...options }, { quoted });

  // [RAGE-fix] كانت بترجّع Promise والـ handler بيستخدمها كنص → دلوقتي async
  // وبتتحقق من الـ cache الأول، والمستدعي لازم يعمل await
  const nameCache = new Map();
  sock.getName = async (jid) => {
    if (!jid) return '';
    jid = sock.decodeJid(jid);
    if (nameCache.has(jid)) return nameCache.get(jid);

    let name = '';
    try {
      if (jid.endsWith('@g.us')) {
        const meta = await sock.groupMetadata(jid);
        name = meta?.subject || '';
      } else {
        const c = sock.contacts?.[jid] || store.contacts?.[jid];
        name = c?.name || c?.verifiedName || c?.notify || '';
      }
    } catch {}

    name = name || String(jid).split('@')[0];
    nameCache.set(jid, name);
    return name;
  };

  sock.getFile = async (url) => {
    try {
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());

      return {
        data: buffer,
        mime: response.headers.get('content-type') || 'image/jpeg',
      };
    } catch (error) {
      console.error('getFile error:', error.message);

      return {
        data: Buffer.alloc(0),
        mime: 'image/jpeg',
      };
    }
  };

  sock.serializeM = (message) => {
    if (!message) return message;

    if (smsgFn) {
      try {
        return smsgFn(sock, message, store);
      } catch {
        return message;
      }
    }

    return message;
  };

  sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    try {
      let content = message;

      if (typeof message === 'object' && message.message) {
        content = message.message;
      }

      return await sock.sendMessage(jid, {
        forward: content,
        force: forceForward,
        ...options,
      });
    } catch (error) {
      console.error('copyNForward:', error.message);
    }
  };

  sock.parseMention = (text) =>
    [...String(text).matchAll(/@([0-9]{5,16}|0)/g)].map(
      (match) => match[1] + '@s.whatsapp.net'
    );

  sock.pushMessage = async (messages) => messages;

  sock.loadMessage = (id) => store.loadMessage(null, id);

  sock.msgqueque = sock.msgqueque || [];
  sock.chats = sock.chats || {};

  if (sock.user && !sock.user.jid && sock.user.id) {
    sock.user.jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  }

  return sock;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const question = (text) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeImportPlugin(relativeDir, fileName) {
  const dirPath = path.join(__dirname, relativeDir);
  const files = await fs.readdir(dirPath);
  const target = fileName.normalize('NFC');

  const match = files.find((file) => file.normalize('NFC') === target);

  if (!match) {
    throw new Error(`Plugin not found: ${relativeDir}/${fileName}`);
  }

  return import(pathToFileURL(path.join(dirPath, match)).href);
}

// Converts Arabic-Indic (٠-٩), Persian (۰-۹) and fullwidth (０-９) digits to
// ASCII, then drops everything that is not a digit (spaces, +, hidden marks).
function toAsciiDigits(value) {
  return String(value)
    .normalize('NFKC')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^0-9]/g, '');
}

// ── Pairing prompts (run BEFORE any connection attempt) ───────────────────────
async function askPhoneNumber() {
  while (true) {
    const input = await question(
      chalk.bgRed.white(' Phone Number with country code (e.g.201234567890): ') + ' '
    );

    const phone = toAsciiDigits(input);

    if (phone.startsWith('0')) {
      console.log(chalk.red.bold(
        'Do not start with 0 — use the country code (Egypt: 20...)'
      ));
      continue;
    }

    if (phone.length >= 10 && phone.length <= 15) {
      return phone;
    }

    console.log(chalk.red.bold(
      `Invalid phone number! (read ${phone.length} digits: "${phone}", need 10-15)`
    ));
  }
}

async function askPairingPassword() {
  while (true) {
    const input = (
      await question(
        chalk.bgRed.white(' Password (8 chars) : ') + ' '
      )
    ).trim();

    if (Array.from(input).length !== 8) {
      console.log(chalk.red.bold('Error: Password must be exactly 8 characters.'));
      continue;
    }

    if (!/^[a-zA-Z0-9\u0600-\u06FF\u0400-\u04FF]+$/.test(input)) {
      console.log(chalk.red.bold(
        'Error: Invalid characters (use English/Arabic/Russian letters or digits).'
      ));
      continue;
    }

    return input.toUpperCase();
  }
}

async function requestPairing(sock, phone, password) {
  // Give the websocket a moment to be ready before asking for a code.
  await sleep(3000);

  try {
    return await sock.requestPairingCode(phone, password);
  } catch (error) {
    console.log(chalk.yellow(
      `Custom code failed (${error.message}). Trying a random code...`
    ));

    return await sock.requestPairingCode(phone);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BANNER
// ══════════════════════════════════════════════════════════════════════════════
const showBanner = () => {
  console.log(gradient(['#FF0000', '#FF4500', '#FFD700'])(`
 ██████╗  █████╗  ██████╗ ███████╗
 ██╔══██╗██╔══██╗██╔════╝ ██╔════╝
 ██████╔╝███████║██║  ███╗█████╗
 ██╔══██╗██╔══██║██║   ██║██╔══╝
 ██║  ██║██║  ██║╚██████╔╝███████╗
 ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  `));

  console.log(chalk.bold.red('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.yellow('║                  RAGE BOT SYSTEM                 ║'));
  console.log(chalk.bold.yellow('║                  Developed by RAGE               ║'));
  console.log(chalk.bold.red('╚══════════════════════════════════════════════════╝\n'));
};

// ══════════════════════════════════════════════════════════════════════════════
// CHANNEL FORWARD CONTEXT (يتحط على كل رسالة يبعتها البوت)
// ══════════════════════════════════════════════════════════════════════════════
const channelContext = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363411851445298@newsletter',
    newsletterName: 'RAGE-BOT',
    serverMessageId: 1,
  },
};

function applyChannelContext(sock) {
  const originalSend = sock.sendMessage.bind(sock);

  sock.sendMessage = (jid, content, options) => {
    if (
      content &&
      typeof content === 'object' &&
      !content.react &&
      !content.delete &&
      !content.forward &&
      !content.poll
    ) {
      content = {
        ...content,
        contextInfo: { ...channelContext, ...(content.contextInfo || {}) },
      };
    }

    return originalSend(jid, content, options);
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONNECT
// ══════════════════════════════════════════════════════════════════════════════
let sock = null;
let retryCount = 0;
let reconnectTimer = null;

const maxRetries = 10;

function scheduleReconnect(delay) {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    connectToWhatsApp(false).catch((error) => {
      console.error('Reconnect error:', error);
    });
  }, delay);
}

export async function connectToWhatsApp(isFirstRun = true) {
  if (isFirstRun) {
    console.clear();
    showBanner();
  }

  // Load saved session
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  // ── 1) If not linked yet: ask for number + password FIRST ──────────────────
  // Nothing about "connecting" is printed until both answers are given.
  const needsPairing = !state.creds.registered;

  let phone = null;
  let pairingPassword = null;

  if (needsPairing) {
    console.log(chalk.bold.yellow('\n[ SETUP ] WhatsApp Pairing Setup\n'));

    phone = await askPhoneNumber();
    pairingPassword = await askPairingPassword();
  }

  // ── 2) Now start connecting ────────────────────────────────────────────────
  console.log(chalk.blue('\nChecking Baileys version...'));

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pinoLogger,

    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pinoLogger),
    },

    printQRInTerminal: false,

    // Pairing code requires a real desktop browser identity.
    browser: Browsers?.ubuntu
      ? Browsers.ubuntu('Chrome')
      : ['Ubuntu', 'Chrome', '20.0.04'],

    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,

    getMessage: async (key) => {
      const message = await store.loadMessage(key.remoteJid, key.id);
      return message?.message || undefined;
    },
  });

  // Register essential listeners immediately.
  patchSock(sock);
  applyChannelContext(sock);
  store.bind(sock.ev);

  sock.ev.on('creds.update', saveCreds);

  // ══════════════════════════════════════════════════════════════════════════
  // CONNECTION UPDATE
  // ══════════════════════════════════════════════════════════════════════════
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      console.log(chalk.yellow('Connecting to WhatsApp...'));
    }

    if (connection === 'open') {
      retryCount = 0;
      global.conn = sock;

      if (sock.user && !sock.user.jid && sock.user.id) {
        sock.user.jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      }

      console.log(chalk.bold.green('\nConnection successful!'));
      console.log(chalk.cyan(`Bot Name: ${sock.user?.name || 'RAGE-Bot'}`));
      console.log(chalk.cyan(`Session ID: ${sock.user?.id || 'Unknown'}`));
      console.log(chalk.cyan('Version: v7.0.1'));

      // Language patch (ترجمة النصوص المرسلة)
      try {
        const { patchSock } = await import('./lib/lang.js');
        patchSock(sock);
      } catch (error) {
        console.log(chalk.yellow('Lang patch: ' + error.message));
      }

      // Fake channel patch
      try {
        const { patchSockWithFakeChannel } = await import('./handler.js');

        if (patchSockWithFakeChannel) {
          patchSockWithFakeChannel(sock);
        }
      } catch (error) {
        console.log(chalk.yellow('Fake channel patch: ' + error.message));
      }

      // Load plugins
      try {
        const { loadPlugins, getPlugins } = await import('./handler.js');

        if (loadPlugins) {
          console.log(chalk.blue('Loading plugins...'));

          await loadPlugins();

          global.plugins = getPlugins ? getPlugins() : {};

          console.log(chalk.green(
            `${Object.keys(global.plugins).length} plugins loaded`
          ));
        }
      } catch (error) {
        console.log(chalk.yellow('Plugins: ' + error.message));
      }

      // Theme manager
      try {
        const { applyTheme, checkThemesDirectory } =
          await import('./lib/themeManager.js');

        await checkThemesDirectory();
        await applyTheme();
      } catch (error) {
        console.log(chalk.yellow('Theme: ' + error.message));
      }

      // Restore sub-sessions
      try {
        const { restoreAllSubSessions } =
          await import('./lib/subSessionManager.js');

        const restored = await restoreAllSubSessions();

        if (restored?.length > 0) {
          console.log(chalk.cyan(`Restored ${restored.length} sub-sessions`));
        }
      } catch (error) {
        console.log(chalk.yellow('Sub-sessions: ' + error.message));
      }
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

      // After a successful pairing WhatsApp forces a restart (515) — reconnect now.
      if (reason === DisconnectReason.restartRequired) {
        console.log(chalk.green('\nPairing accepted. Restarting connection...'));
        scheduleReconnect(500);
        return;
      }

      console.log(chalk.red(`Connection lost. Reason: ${reason}`));

      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.bgRed.white(
          'Logged out! Delete ./sessions and restart.'
        ));

        process.exit(1);
        return;
      }

      if (retryCount < maxRetries) {
        retryCount++;

        const delay = 4000 * retryCount;

        console.log(chalk.yellow(
          `Retrying in ${delay / 1000}s (${retryCount}/${maxRetries})`
        ));

        scheduleReconnect(delay);
      } else {
        console.log(chalk.red('Maximum retries exceeded.'));
        process.exit(1);
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EVENT WIRING
  // ══════════════════════════════════════════════════════════════════════════

  // Messages
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    if (chatUpdate.type !== 'notify') return;

    let stage = 'import handler.js';
    try {
      const { handler } = await import('./handler.js');

      try {
        const { resolveIncoming, useLang, handleReply } = await import('./lib/lang.js');
        // رد المستخدم برقم اللغة (0.1 … 1.0) بدون بريفكس
        if (await handleReply(sock, chatUpdate.messages?.[0])) return;
        for (const msg of chatUpdate.messages || []) resolveIncoming(msg);
        useLang(chatUpdate.messages?.[0]?.key?.remoteJid);
      } catch (e) { console.error(chalk.yellow('[lang] hook:'), e?.stack || e); }

      if (handler) {
        stage = 'handler()';
        await handler.call(sock, chatUpdate);
      }
    } catch (error) {
      // [RAGE-fix] error.message was undefined for non-Error throws; print the full error + stage
      console.error(chalk.red('messages.upsert [' + stage + ']:'), error?.stack || error);
      console.error(chalk.red('  thrown value type:'), typeof error, '| is Error:', error instanceof Error);
      console.error(chalk.red('  message sent by:'), chatUpdate?.messages?.[0]?.key?.remoteJid, '| text:', JSON.stringify(chatUpdate?.messages?.[0]?.message || {}).slice(0, 200));
    }
  });

  // Group participants
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { participantsUpdate } = await import('./handler.js');

      if (participantsUpdate) {
        await participantsUpdate.call(sock, update);
      }
    } catch (error) {
      // [RAGE-fix] error.message was undefined for non-Error throws; print the full error
      console.error(chalk.red('group-participants.update:'), error?.stack || error);
    }
  });

  // Groups update
  sock.ev.on('groups.update', async (update) => {
    try {
      const { groupsUpdate } = await import('./handler.js');

      if (groupsUpdate) {
        await groupsUpdate.call(sock, update);
      }
    } catch (error) {
      // [RAGE-fix] error.message was undefined for non-Error throws; print the full error
      console.error(chalk.red('groups.update:'), error?.stack || error);
    }
  });

  // Calls
  sock.ev.on('call', async (calls) => {
    try {
      const { callUpdate } = await import('./handler.js');

      if (callUpdate) {
        await callUpdate.call(sock, calls);
      }
    } catch (error) {
      // [RAGE-fix] error.message was undefined for non-Error throws; print the full error
      console.error(chalk.red('call:'), error?.stack || error);
    }
  });

  // Deleted messages
  sock.ev.on('messages.delete', async (item) => {
    try {
      const { deleteUpdate } = await import('./handler.js');

      if (deleteUpdate) {
        await deleteUpdate.call(sock, item);
      }
    } catch (error) {
      // [RAGE-fix] error.message was undefined for non-Error throws; print the full error
      console.error(chalk.red('messages.delete:'), error?.stack || error);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP PROTECTION (optional plugin)
  // ══════════════════════════════════════════════════════════════════════════
  try {
    const protection = await safeImportPlugin('plugins', 'حماية.js');

    if (protection.attachProtectionListener) {
      protection.attachProtectionListener(sock);
      console.log(chalk.green('Group protection enabled.'));
    }
  } catch {
    // Protection plugin is optional.
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIMERS (created once)
  // ══════════════════════════════════════════════════════════════════════════
  if (!global.__rageDbInterval) {
    global.__rageDbInterval = setInterval(async () => {
      if (global.db?.data) {
        await global.db.write().catch(console.error);
      }
    }, 10 * 1000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAIRING CODE REQUEST (after the socket + listeners are ready)
  // ══════════════════════════════════════════════════════════════════════════
  if (needsPairing) {
    try {
      console.log(chalk.cyan('\nRequesting Pairing Code...'));

      const code = await requestPairing(sock, phone, pairingPassword);

      console.log('\n' + chalk.bold.red('╔══════════════════════════════════════╗'));
      console.log(chalk.bold.yellow('║          RAGE PAIRING SYSTEM         ║'));
      console.log(chalk.bold.red('╚══════════════════════════════════════╝'));

      console.log(chalk.green(`\nPhone Number: ${phone}`));
      console.log(chalk.cyan(`Pairing Code: ${code}`));

      console.log(chalk.yellow('\nPAIRING INSTRUCTIONS:'));
      console.log(chalk.white('1. Open WhatsApp.'));
      console.log(chalk.white('2. Go to Linked Devices.'));
      console.log(chalk.white('3. Select Link with phone number.'));
      console.log(chalk.white('4. Enter the pairing code above.\n'));
    } catch (error) {
      console.error(chalk.red('\nPAIRING ERROR:'), error.message);
      process.exit(1);
      return;
    }
  }

  return sock;
}

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
connectToWhatsApp().catch((error) => {
  console.error('Startup Error:', error);
});

export { sock, store };
export default connectToWhatsApp;
process.on('unhandledRejection', e => console.log('Rejection:', e?.message))
process.on('uncaughtException', e => console.log('Exception:', e))

// [RAGE-fix] حفظ الداتابيز قبل ما البوت يتقفل (restart / hot reload) عشان التسجيل مايضيعش
let _shuttingDown = false
const saveAndExit = async (sig) => {
  if (_shuttingDown) return
  _shuttingDown = true
  console.log(`[${sig}] saving database...`)
  try {
    if (global.db?.data) await global.db.write()
  } catch (e) {
    console.error(e)
  }
  process.exit(0)
}
process.on('SIGTERM', () => saveAndExit('SIGTERM'))
process.on('SIGINT', () => saveAndExit('SIGINT'))

import chokidar from 'chokidar'

const PLUGINS_DIR = path.join(__dirname, 'plugins')

chokidar.watch(PLUGINS_DIR, {
  ignoreInitial: true,
  usePolling: true,
  interval: 700,
  awaitWriteFinish: { stabilityThreshold: 300 },
}).on('all', async (event, file) => {
  if (!file.endsWith('.js')) return
  const name = path.relative(PLUGINS_DIR, file)
  global.plugins = global.plugins || {}

  if (event === 'unlink') {
    delete global.plugins[name]
    return console.log(chalk.red(`🗑️ plugin removed: ${name}`))
  }

  try {
    const mod = await import(pathToFileURL(file).href + '?update=' + Date.now())
    global.plugins[name] = mod.default || mod
    console.log(chalk.green(`♻️ plugin reloaded: ${name}`))
  } catch (e) {
    console.log(chalk.red(`❌ plugin error ${name}:`), e.message)
  }
})