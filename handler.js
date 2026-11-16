import * as baileysNs from '@whiskeysockets/baileys'
// [RAGE-fix] Baileys is CommonJS: named exports are not guaranteed, so merge .default
const baileys = { ...(baileysNs.default && typeof baileysNs.default === 'object' ? baileysNs.default : {}), ...baileysNs }
const { generateWAMessageFromContent } = baileys
import { smsg } from './lib/simple.js'
import { format } from 'util' 
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import ws from 'ws';
import { tr, translateText } from './lib/_checkLang.js';
import { makeStore } from './lib/MakeStore.js';
import crmstore from './lib/crmstore.js';
global.crmstore = crmstore;

import pino from 'pino';
import { Boom } from '@hapi/boom';
// [RAGE-fix] file-type v17+ has no default export
// import * as FileType from 'file-type';
import * as FileType from 'file-type';
import { exec, spawn, execSync } from 'child_process';
import axios from 'axios';
// [RAGE-fix] duplicate import (chalk is already imported on line 7)
// import chalk from 'chalk';
import express from 'express';
import PhoneNumber from 'awesome-phonenumber';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from './lib/exif.js';
import { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } from './lib/botFunctions.js';
import authenticationn from './lib/auth.js';
// [RAGE-fix] importing from itself + smsg already imported from ./lib/simple.js
// import { smsg } from './handler.js';
import { getBannedUsers, banUser, mapLidToPhone, getPhoneFromLid } from './config.js';
import { restoreFromGist, startBackupInterval } from './lib/dbBackup.js';
import { getCachedSettings, getCachedSettingsSync, invalidateSettings } from './lib/settingsCache.js';
import { botname } from './settings.js';
import { DateTime } from 'luxon';
// [RAGE-fix] a file cannot import from itself (handler.js does not export these)
// import { commands, totalCommands, commandsReady } from './handler.js';
// [RAGE-fix] a file cannot import from itself
// import groupEvents from './handler.js';
// [RAGE-fix] a file cannot import from itself
// import connectionHandler from './handler.js';
import toxic from './src/rage.js';
import antibot from './lib/antibot.js';
import './lib/cleanup.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

process.env.FFMPEG_PATH = ffmpegInstaller.path;
/**
 * @type {import('@adiwajshing/baileys')}
 */
// [RAGE-fix] the function header was missing (this return was outside any function)
function makeFakeContact(m) {
   return {
    key: {
      participants: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast',
      fromMe: false,
      id: 'RAGE'
    },
    message: {
      contactMessage: {
        displayName: m.pushName || 'Unknown',
        vcard: `BEGIN:VCARD
VERSION:3.0
N:${m.pushName || 'User'};;;;
FN:${m.pushName || 'User'}
item1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}
item1.X-ABLabel:📞 WhatsApp
ORG:BOT ✓
TITLE:Verified
END:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  };
}

const {proto, jidNormalizedUser, areJidsSameUser} = baileys

const isNumber = (x) => typeof x === 'number' && !isNaN(x)
const delay = (ms) =>
isNumber(ms) &&
new Promise((resolve) =>
setTimeout(function () {
clearTimeout(this)
resolve()
}, ms)
)

// ═══════════════════════════════════════════════════════════════════════
// [RAGE-fix] Module-level code that was pasted INSIDE handler(): moved here
// (copy/paste, nothing deleted). Order matters: logger is defined in the first part.
// ═══════════════════════════════════════════════════════════════════════
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginsDir = path.join(__dirname, 'plugins')
const cooldowns = new Map()
const reported = new Map()

// [RAGE-fix] duplicate import (chalk is already imported at the top)
// import chalk from "chalk";
import { db } from "jsonion";

async function addElite({ sock, ids }) {
  const eliteDB = new db("elite-pro.json");
  let result = { fail: [], success: [] };
  if (!ids || !sock)
    return console.log(chalk.red("should input ids or add sock"));

  for (const id of ids) {
    const is = {
      lid: id.endsWith("@lid"),
      jid: id.endsWith("@s.whatsapp.net"),
    };

    switch (true) {
      case is.lid:
        const lids = eliteDB.get("lids");
        if (lids.includes(id)) {
          result.fail.push({
            id: id,
            type: "lid",
            error: "exist_already",
            success: false,
            action: "add",
          });
          continue;
        }
        eliteDB.pushToPath("lids", id);
        result.success.push({
          id: id,
          type: "lid",
          error: null,
          success: true,
          action: "add",
        });
        break;
      case is.jid:
        const jids = eliteDB.get("jids");
        if (jids.includes(id)) {
          result.fail.push({
            id: id,
            type: "jid",
            error: "exist_already",
            success: false,
            action: "add",
          });
          continue;
        }
        const [info] = await sock.onWhatsApp(id);
        eliteDB.pushToPath("jids", id);

        if (!eliteDB.get("lids").includes(info.lid))
          eliteDB.pushToPath("lids", info.lid);
        const twice = eliteDB.get("twice");
        eliteDB.set("twice", {
          ...twice,
          [info.lid]: info.jid,
          [info.jid]: info.lid,
        });
        result.success.push({
          id: id,
          type: "jid",
          error: null,
          success: true,
          action: "add",
        });
        break;
      default:
        continue;
    }
  }
  return result;
}

async function rmElite({ sock, ids }) {
  const eliteDB = new db("elite-pro.json");
  let result = { fail: [], success: [] };
  if (!ids || !sock)
    return console.log(chalk.red("should input ids or add sock"));

  for (const id of ids) {
    const is = {
      lid: id.endsWith("@lid"),
      jid: id.endsWith("@s.whatsapp.net"),
    };

    switch (true) {
      case is.lid:
        const lids = eliteDB.get("lids");
        if (!lids.includes(id)) {
          result.fail.push({
            id: id,
            type: "lid",
            error: "not_exist",
            success: false,
            action: "remove",
          });
          continue;
        }
        const twice1 = eliteDB.get("twice");
        const jids1 = eliteDB.get("jids");
        eliteDB.set(
          "lids",
          lids.filter((l) => l !== id)
        );
        if (twice1[id]) {
          eliteDB.set(
            "jids",
            jids1.filter((j) => j !== twice1[id])
          );
          delete twice1[twice1[id]];
          delete twice1[id];
          eliteDB.set("twice", twice1);
        }

        result.success.push({
          id: id,
          type: "lid",
          error: null,
          success: true,
          action: "remove",
        });

        break;

      case is.jid:
        const [info] = await sock.onWhatsApp(id);
        const jids = eliteDB.get("jids");
        const lids1 = eliteDB.get("lids");
        const twice = eliteDB.get("twice");
        if (!jids.includes(id) && !lids1.includes(info.lid)) {
          result.fail.push({
            id: id,
            type: "jid",
            error: "not_exist",
            success: false,
            action: "remove",
          });
          continue;
        }
        if (jids.includes(id))
          eliteDB.set(
            "jids",
            jids.filter((j) => j !== id)
          );
        if (lids1.includes(info.lid))
          eliteDB.set(
            "lids",
            lids1.filter((l) => l !== info.lid)
          );

        if (twice[id]) delete twice[id];
        if (twice[info.lid]) delete twice[info.lid];
        console.log("twicen", twice);

        eliteDB.set("twice", twice);
        result.success.push({
          id: id,
          type: "jid",
          error: null,
          success: true,
          action: "remove",
        });
        break;
      default:
        continue;
    }
  }
  return result;
}

// [RAGE-fix] a file can only have one default export (the last one is elitePro)
// export default {
export const jidHelpers = {
    replyedJid: (msg) => {
    const participant =
      msg?.message?.extendedTextMessage?.contextInfo?.participant;
    return participant ? [participant] : null;
  },
  mentionnedJids: (msg) => {
    const jids = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    return Array.isArray(jids) && jids.length > 0 ? jids.filter(Boolean) : null;
  },
}

import fs from "fs-extra";
// [RAGE-fix] duplicate import (path is already imported at the top)
// import path from "path";
// [RAGE-fix] fileURLToPath is already imported at the top
// import { pathToFileURL, fileURLToPath } from "url";
import { pathToFileURL } from "url";
// [RAGE-fix] duplicate import (chalk is already imported at the top)
// import chalk from "chalk"; 

const colors = {
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m"
};

const logger = {
  info: (...args) => console.log(colors.blue, ...args, colors.reset),
  success: (...args) => console.log(colors.green, ...args, colors.reset),
  warn: (...args) => console.log(colors.yellow, ...args, colors.reset),
  error: (...args) => console.log(colors.red, ...args, colors.reset),
  debug: (...args) => { if (process.env.DEBUG) console.log(colors.blue, ...args, colors.reset) }
};

let loadedPlugins = {};
let pluginIssues = [];

// [RAGE-fix] exports that src/rage.js imports from handler.js
export const commands = new Map();
export const aliases = new Map();
export let totalCommands = 0;
export let commandsReady = false;
export const lidMappingCache = new Map();

function rebuildCommandIndex() {
  commands.clear();
  aliases.clear();
  for (const [key, plugin] of Object.entries(loadedPlugins)) {
    commands.set(key, plugin);
    const list = plugin?.aliases || plugin?.alias;
    for (const a of [].concat(list || [])) {
      if (typeof a === 'string') aliases.set(a.toLowerCase().trim(), key);
    }
  }
  totalCommands = commands.size;
  commandsReady = true;
}

// يملأ lidMappingCache — rage.js بيستخدم المفتاح = رقم الـ lid (أرقام فقط) والقيمة = رقم الهاتف
// وبينادي seedParticipants(client, participants)
export function seedParticipants(client, participants = []) {
  const digits = (j) => String(j || '').split('@')[0].split(':')[0].replace(/\D/g, '');
  for (const p of participants || []) {
    const jid = p?.phoneNumber || (p?.id?.endsWith?.('@s.whatsapp.net') ? p.id : (p?.jid?.endsWith?.('@s.whatsapp.net') ? p.jid : null));
    const lid = p?.lid || (p?.id?.endsWith?.('@lid') ? p.id : null);
    const lidNum = digits(lid), num = digits(jid);
    if (lidNum && num && lidNum !== num) lidMappingCache.set(lidNum, num);
  }
  return lidMappingCache.size;
}

export function getPluginIssues() {
  return pluginIssues;
}


async function getAllJsFiles(dir) {
  let results = [];
  
  if (!await fs.pathExists(dir)) return results;

  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const item of list) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const subFiles = await getAllJsFiles(fullPath);
      results = results.concat(subFiles);
    } else if (item.isFile() && item.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}



async function loadSinglePlugin(filePath, themeHex) {
  try {
    const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
    const module = await import(fileUrl);

    let handler = null;

    if (module.default && module.default.NovaUltra && typeof module.default.execute === "function") {
      handler = { ...module.default.NovaUltra, execute: module.default.execute };
    } else if (module.default && typeof module.default.execute === "function") {
      handler = module.default;
    } else if (module.NovaUltra && typeof module.execute === "function") {
      handler = { ...module.NovaUltra, execute: module.execute };
    } else if (typeof module.execute === "function") {
      handler = module;
    }

    // [RAGE-fix] classic plugins (export default async function handler(m, extra) + handler.command)
    // were skipped here, and dispatch only runs functions, so no command ever worked.
    // They are stored by file name relative to ./plugins, which is what dispatch expects.
    if (!handler && typeof module.default === "function") {
      const pluginsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "plugins");
      const key = path.relative(pluginsRoot, filePath);
      module.default.filePath = filePath;
      loadedPlugins[key] = module.default;
      console.log(chalk.hex(themeHex)(`🛸 Plugin loaded: ${key}`));
      return;
    }

    if (!handler || !handler.execute) {
      logger.warn(`⚠ Skipped (no execute): ${filePath}`);
      pluginIssues.push(`❌ Skipped: ${filePath}`);
      return;
    }

    handler.filePath = filePath;

    let commands = handler.command;

    if (!commands) {
      const fileName = path.basename(filePath).replace(".js", "");
      commands = [fileName];
      logger.info(`ℹ '${fileName}' ⬇️  NAME FILE IS THE COMMAND HERE UNTIL YOU FIX IT`);
    } else if (typeof commands === "string") {
      commands = [commands];
    } else if (!Array.isArray(commands)) {
      logger.warn(`⚠ Invalid command format in ${filePath}`);
      pluginIssues.push(`❌ Invalid command format: ${filePath}`);
      return;
    }

    for (const cmd of commands) {
      if (typeof cmd !== "string") continue;

      const key = cmd.toLowerCase().trim();
      loadedPlugins[key] = handler;
      
      
      console.log(chalk.hex(themeHex)(`🛸 Plugin loaded: ${key}`));
    }

  } catch (err) {
    logger.error(`❌ Failed to load plugin (${filePath}):`, err);
    pluginIssues.push(`❌ Failed loading: ${filePath}\n${String(err)}`);
  }
}



export async function loadPlugins(themeColor) {
  loadedPlugins = {};
  pluginIssues = [];


  let hexColor = themeColor || '#00FF00';
  if (!hexColor.startsWith('#')) hexColor = '#' + hexColor;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // [RAGE-fix] this file lives in the project root, so the plugins folder is ./plugins
  // const pluginsDir = path.join(__dirname, "../plugins");
  const pluginsDir = path.join(__dirname, "./plugins");

  await fs.ensureDir(pluginsDir);

  const files = await getAllJsFiles(pluginsDir);

  for (const file of files) {
    
    await loadSinglePlugin(file, hexColor);
  }

  
  rebuildCommandIndex();
  console.log(chalk.hex(hexColor)("🔌 All plugins loaded successfully"));
  
  return loadedPlugins;
}

export function getPlugins() {
  return loadedPlugins;
}

// ═══════════════════════════════════════════════════════════════════════
// [FAST] فهرس الأوامر: بدل ما كل رسالة تلف على كل البلجنز وتعمل regex لكل واحد،
// بنبني فهرس مرة واحدة (command -> plugins) ونشغّل بس البلجنز اللي ممكن تهم الرسالة.
// الفهرس بيتبني تاني لوحده لو global.plugins اتغيّر (بلجن اتضاف/اتشال/اتبدل).
// ═══════════════════════════════════════════════════════════════════════
let _idx = null
const _esc = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

function _buildIndex(plugins) {
  const order = new Map()
  const refs = new Map()
  const always = new Set()
  const byCmd = new Map()
  let i = 0
  for (const name in plugins) {
    const p = plugins[name]
    order.set(name, i++)
    refs.set(name, p)
    if (!p || p.disabled) continue
    const isFn = typeof p === 'function'
    const hasHook = typeof p.all === 'function' || typeof p.before === 'function'
    const cmd = p.command
    const strCmds =
      typeof cmd === 'string' ? [cmd]
      : Array.isArray(cmd) && cmd.length && cmd.every((c) => typeof c === 'string') ? cmd
      : null
    // بلجنز بتحتاج المعالجة الكاملة: hooks / customPrefix / command بـ regex
    if (hasHook || p.customPrefix || (isFn && cmd && !strCmds)) { always.add(name); continue }
    if (isFn && strCmds) {
      for (const c of strCmds) {
        if (!byCmd.has(c)) byCmd.set(c, [])
        byCmd.get(c).push(name)
      }
    }
  }
  return { order, refs, always, byCmd }
}

function _isValid(plugins) {
  if (!_idx) return false
  let n = 0
  for (const name in plugins) {
    n++
    if (_idx.refs.get(name) !== plugins[name]) return false
  }
  return n === _idx.refs.size
}

export function invalidatePluginIndex() { _idx = null }

export function getCandidatePlugins(conn, text, defaultPrefix) {
  const plugins = global.plugins || {}
  if (!_isValid(plugins)) _idx = _buildIndex(plugins)

  const _prefix = conn?.prefix || defaultPrefix
  const regs =
    _prefix instanceof RegExp ? [_prefix]
    : Array.isArray(_prefix) ? _prefix.map((p) => (p instanceof RegExp ? p : new RegExp(_esc(p))))
    : typeof _prefix === 'string' ? [new RegExp(_esc(_prefix))]
    : []

  let cmd = ''
  for (const re of regs) {
    const mt = re.exec(text)
    if (mt) {
      cmd = (text.slice((mt[0] || '').length).trim().split(/\s+/)[0] || '').toLowerCase()
      break
    }
  }

  const hit = cmd ? _idx.byCmd.get(cmd) : null
  if (!hit) return [..._idx.always]
  const names = new Set(_idx.always)
  for (const n of hit) names.add(n)
  return [...names].sort((a, b) => _idx.order.get(a) - _idx.order.get(b))
}

// ═══════════════════════════════════════════════════════════════════════
// [FAST] ريلود بسيط: بيراقب فولدر plugins بس، وعند تغيير ملف واحد بيعيد تحميله هو بس.
// ولازم تمسح أي watcher قديم بيعيد تحميل كل الملفات (في main/index).
// ═══════════════════════════════════════════════════════════════════════
export function startPluginWatcher() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugins')
  const timers = new Map()
  const onChange = (file) => {
    clearTimeout(timers.get(file))
    timers.set(file, setTimeout(async () => {
      timers.delete(file)
      const full = path.join(root, file)
      try {
        if (!(await fs.pathExists(full))) { delete global.plugins[file]; invalidatePluginIndex(); return }
        const mod = await import(pathToFileURL(full).href + `?t=${Date.now()}`)
        global.plugins[file] = mod.default
        invalidatePluginIndex()
        console.log(chalk.green(`♻️ reloaded: ${file}`))
      } catch (e) {
        console.error(`❌ reload failed (${file}):`, e.message)
      }
    }, 300))
  }
  try {
    return fs.watch(root, { recursive: true }, (_ev, file) => {
      if (file && file.endsWith('.js')) onChange(file)
    })
  } catch (e) {
    console.error('plugin watcher not started:', e.message)
  }
}


async function isElite({ sock, id }) {
  const eliteDB = new db("elite-pro.json");
  const is = {
    lid: id.endsWith("@lid"),
    jid: id.endsWith("@s.whatsapp.net"),
  };

  const jids = eliteDB.get("jids") || [];
  const lids = eliteDB.get("lids") || [];
  const twice = eliteDB.get("twice") || {};
  if (is.jid) {
    if (jids.includes(id)) return true;
    const [info] = (await sock.onWhatsApp(id)) || [];
    if (info?.lid && lids.includes(info.lid)) {
      eliteDB.pushToPath("jids", id);
      eliteDB.set("twice", {
        ...twice,
        [info.jid]: info.lid,
        [info.lid]: info.jid,
      });
      return true;
    }
  }
  if (is.lid) {
    return lids.includes(id);
  }
  return false;
}

function getElites() {
  const eliteDB = new db("elite-pro.json");
  const lids = eliteDB.get("lids");
  return lids.length > 0 ? lids : null;
}


async function eliteReset({ sock } = {}) {

  if (!sock) {
    console.log(chalk.red("❌ Error: sock is required for smart eliteReset"));

    const eliteDB = new db("elite-pro.json");
    eliteDB.set("lids", []);
    eliteDB.set("jids", []);
    eliteDB.set("twice", {});
    return true;
  }

  const eliteDB = new db("elite-pro.json");
  

  const botJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";
  

  const jids = eliteDB.get("jids") || [];
  const twice = eliteDB.get("twice") || {};


  const isBotInJids = jids.includes(botJid);

  if (isBotInJids) {
    
    console.log(chalk.green(`Elite Reset: Keeping Bot (${botJid}) in Elite.`));
    
    const botLid = twice[botJid];

    eliteDB.set("jids", [botJid]);
    
    if (botLid) {
        eliteDB.set("lids", [botLid]);
        eliteDB.set("twice", {
            [botJid]: botLid,
            [botLid]: botJid
        });
    } else {
        eliteDB.set("lids", []);
        eliteDB.set("twice", {});
    }

  } else {

    console.log(chalk.yellow(`Elite Reset: Bot not found, clearing all.`));
    eliteDB.set("lids", []);
    eliteDB.set("jids", []);
    eliteDB.set("twice", {});
  }
  
  return true;
}

// [RAGE-fix] this JSON is the content of handlers/elite-pro.json, it is not JavaScript:
// {
//   "jids": [
//     
//   ],
//   "lids": [
//     
//   ],
//   "twice": {
// 
//   }
// }

const elitePro = { addElite, rmElite, isElite, getElites, eliteReset };
export default elitePro;

// [RAGE-fix] the opening of this try block and the soundFX variable were missing
let soundFX = null;
try {
const soundsModule = await import('./utils/sounds.js');
    soundFX = soundsModule.playSound || soundsModule.default?.playSound || soundsModule.default;

    // ✅ تحقق من أن الاستيراد رجع دالة فعلاً، وسجّل الحالة بوضوح في اللوج
    if (typeof soundFX !== 'function') {
        logger.warn(`⚠️ utils/sounds.js لم يُصدّر دالة playSound صالحة (النوع: ${typeof soundFX})، سيتم تعطيل المؤثرات الصوتية.`);
        soundFX = null;
    } else {
        logger.info('🔊 نظام الأصوات تم تحميله بنجاح');
    }
} catch (e) {
    logger.warn(`⚠️ تعذر تحميل ملف utils/sounds.js: ${e.message}`);
}

// التأكد من أن playSound دالة دائماً لتجنب أخطاء التنفيذ
// ✅ أصبحت async + try/catch لمنع أي unhandled rejection وتسجيل سبب الفشل
export const playSound = async (type) => {
    try {
        if (typeof soundFX === 'function') {
            await soundFX(type);
        }
    } catch (err) {
        // تجاهل أخطاء الصوت بصمت - لا تؤثر على عمل البوت
        logger.debug(`صوت ${type} فشل: ${err.message}`);
    }
};

import { glob } from 'glob';
import ms from 'ms';
import _ from 'lodash';
import moment from 'moment-timezone';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';

// الحصول على __dirname في ES modules
const __filename = fileURLToPath(import.meta.url);
// [RAGE-fix] __dirname is already declared above
// const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════════════════════════════
// ✅ [مضاف] القناة الوهمية — FAKE CHANNEL
// كل رسالة صادرة ستُضاف لها newsletterJid تلقائياً
// ══════════════════════════════════════════════════════════════════════════════
const FAKE_CHANNEL_JID = '120363427461580439@newsletter';

/**
 * تطبيق القناة الوهمية على sock.sendMessage بشكل موثوق
 * يمنع التطبيق المزدوج تلقائياً
 */
export function patchSockWithFakeChannel(sock) {
    if (sock.__fakeChannelPatched) return sock;
    sock.__fakeChannelPatched = true;

    const _origSend = sock.sendMessage.bind(sock);

    sock.sendMessage = async function patchedSend(jid, content, options = {}) {
        // نُضيف newsletterJid لأي رسالة — ما عدا رسائل الـ reaction لأنها لا تقبله
        if (content && typeof content === 'object' && !content.react) {
            content.newsletterJid  = FAKE_CHANNEL_JID;
            content.channelJid     = FAKE_CHANNEL_JID;
            content.fromNewsletter = true;
        }
        return _origSend(jid, content, options);
    };

    logger.info(chalk.cyan(`📡 القناة الوهمية مفعّلة → كل الرسائل ستُرسل باسم القناة`));
    return sock;
}

global.isOwner = (jid) => {
    const manualOwners = ['201221579275']; 
    const owners = global.owner || []; 
    const clean = (num) => String(num).replace(/[^0-9]/g, '');
    const senderNumber = clean(jid);

    return owners.some(ownerArray => {
        let number = Array.isArray(ownerArray) ? ownerArray[0] : ownerArray;
        return number && clean(number) === senderNumber;
    }) || manualOwners.includes(senderNumber);
};

global.isElite = async (jid, sock = global.conn) => {
    try {
        if (!jid || !sock) return false;
        return await isElite({ sock, id: jid });
    } catch (e) {
        logger.warn(`خطأ في isElite: ${e.message}`);
        return false;
    }
};


// ═══════════════ end of moved code ═══════════════


/**
 * Handle messages upsert
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate
 */
export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate) {
return
}
if (!chatUpdate || !chatUpdate.messages) {
return
} else {
this.pushMessage(chatUpdate.messages).catch(console.error)
}
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) {
return
}
if (global.db.data == null) await global.loadDatabase()
try {
m = smsg(this, m) || m
if (!m) return
m.exp = 0
m.limit = false
m.money = false
try {
// TODO: use loop to insert data instead of this
let user = global.db.data.users[m.sender]
if (typeof user !== 'object') global.db.data.users[m.sender] = {}
if (user) {
if (!isNumber(user.exp)) user.exp = 0
if (user.exp < 0) user.exp = 0
if (!isNumber(user.money)) user.money = 150
if (user.money < 0) user.money = 0
if (!isNumber(user.limit)) user.limit = 15
if (user.limit < 0) user.limit = 0
if (!isNumber(user.joincount)) user.joincount = 1
if (user.joincount < 0) user.joincount = 0
if (!('premium' in user)) user.premium = false
if (!('muto' in user)) user.muto = false
if (!('registered' in user)) user.registered = false
if (!('registroR' in user)) user.registroR = false
if (!('registroC' in user)) user.registroC = false
if (!isNumber(user.IDregister)) user.IDregister = 0
if (!user.registered) {
if (!('name' in user)) user.name = m.name
if (!('age' in user)) user.age = 0
if (!('descripcion' in user)) user.descripcion = 0
if (!('genero' in user)) user.genero = 0
if (!('identidad' in user)) user.identidad = 0
if (!('pasatiempo' in user)) user.pasatiempo = 0
if (!('tiempo' in user)) user.tiempo = 0
if (!('miestado' in user)) user.miestado = 0
if (!('midLanguage' in user)) user.midLanguage = 0
if (!isNumber(user.premLimit)) user.premLimit = 0
if (!isNumber(user.anggur)) user.anggur = 0
if (!isNumber(user.apel)) user.apel = 0
if (!isNumber(user.bibitanggur)) user.bibitanggur = 0
if (!isNumber(user.bibitapel)) user.bibitapel = 0
if (!isNumber(user.bibitjeruk)) user.bibitjeruk = 0
if (!isNumber(user.bibitmangga)) user.bibitmangga = 0
if (!isNumber(user.bibitpisang)) user.bibitpisang = 0
if (!isNumber(user.emas)) user.emas = 0
if (!isNumber(user.jeruk)) user.jeruk = 0
if (!isNumber(user.kayu)) user.kayu = 0
if (!isNumber(user.makanan)) user.makanan = 0
if (!isNumber(user.mangga)) user.mangga = 0
if (!isNumber(user.pisang)) user.pisang = 0
if (!isNumber(user.premiumDate)) user.premiumDate = -1
if (!isNumber(user.regTime)) user.regTime = -1
if (!isNumber(user.semangka)) user.semangka = 0
if (!isNumber(user.stroberi)) user.stroberi = 0
}

if (!isNumber(user.afk)) user.afk = -1
//if (!('autolevelup' in user))  user.autolevelup = true
if (!isNumber(user.reporte)) user.reporte = 0
if (!('role' in user)) user.role = '*NOVATO(A)* 🪤'
if (!isNumber(user.agility)) user.agility = 0
if (!isNumber(user.anakanjing)) user.anakanjing = 0
if (!user.warnPv) user.warnPv = false
// [RAGE-fix] typo: it was resetting anakanjing on every message
// if (!isNumber(user.mesagge)) user.anakanjing = 0
if (!isNumber(user.mesagge)) user.mesagge = 0
if (!isNumber(user.anakcentaur)) user.anakcentaur = 0
if (!isNumber(user.anakgriffin)) user.anakgriffin = 0
if (!isNumber(user.anakkucing)) user.anakkucing = 0
if (!isNumber(user.anakkuda)) user.anakkuda = 0
if (!isNumber(user.anakkyubi)) user.anakkyubi = 0
if (!isNumber(user.anaknaga)) user.anaknaga = 0
if (!isNumber(user.anakpancingan)) user.anakpancingan = 0
if (!isNumber(user.anakphonix)) user.anakphonix = 0
if (!isNumber(user.anakrubah)) user.anakrubah = 0
if (!isNumber(user.anakserigala)) user.anakserigala = 0
if (!isNumber(user.anggur)) user.anggur = 0
if (!isNumber(user.anjing)) user.anjing = 0
if (!isNumber(user.juegos)) user.juegos = 0
if (!isNumber(user.anjinglastclaim)) user.anjinglastclaim = 0
if (!isNumber(user.antispam)) user.antispam = 0
if (!isNumber(user.antispamlastclaim)) user.antispamlastclaim = 0
if (!isNumber(user.apel)) user.apel = 0
if (!isNumber(user.aqua)) user.aqua = 0
if (!isNumber(user.arc)) user.arc = 0
if (!isNumber(user.arcdurability)) user.arcdurability = 0
if (!isNumber(user.arlok)) user.arlok = 0
if (!isNumber(user.armor)) user.armor = 0
if (!isNumber(user.armordurability)) user.armordurability = 0
if (!isNumber(user.armormonster)) user.armormonster = 0
if (!isNumber(user.as)) user.as = 0
if (!isNumber(user.atm)) user.atm = 0
if (!isNumber(user.axe)) user.axe = 0
if (!isNumber(user.axedurability)) user.axedurability = 0
if (!isNumber(user.ayam)) user.ayam = 0
if (!isNumber(user.ayamb)) user.ayamb = 0
if (!isNumber(user.ayambakar)) user.ayambakar = 0
if (!isNumber(user.ayamg)) user.ayamg = 0
if (!isNumber(user.ayamgoreng)) user.ayamgoreng = 0
if (!isNumber(user.babi)) user.babi = 0
if (!isNumber(user.babihutan)) user.babihutan = 0
if (!isNumber(user.babipanggang)) user.babipanggang = 0
if (!isNumber(user.bandage)) user.bandage = 0
if (!isNumber(user.bank)) user.bank = 0
if (!isNumber(user.banteng)) user.banteng = 0
if (!isNumber(user.batu)) user.batu = 0
if (!isNumber(user.bawal)) user.bawal = 0
if (!isNumber(user.bawalbakar)) user.bawalbakar = 0
if (!isNumber(user.bayam)) user.bayam = 0
if (!isNumber(user.berlian)) user.berlian = 10
if (!isNumber(user.bibitanggur)) user.bibitanggur = 0
if (!isNumber(user.bibitapel)) user.bibitapel = 0
if (!isNumber(user.bibitjeruk)) user.bibitjeruk = 0
if (!isNumber(user.bibitmangga)) user.bibitmangga = 0
if (!isNumber(user.bibitpisang)) user.bibitpisang = 0
if (!isNumber(user.botol)) user.botol = 0
if (!isNumber(user.bow)) user.bow = 0
if (!isNumber(user.bowdurability)) user.bowdurability = 0
if (!isNumber(user.boxs)) user.boxs = 0
if (!isNumber(user.brick)) user.brick = 0
if (!isNumber(user.brokoli)) user.brokoli = 0
if (!isNumber(user.buaya)) user.buaya = 0
if (!isNumber(user.buntal)) user.buntal = 0
if (!isNumber(user.cat)) user.cat = 0
if (!isNumber(user.catexp)) user.catexp = 0
if (!isNumber(user.catlastfeed)) user.catlastfeed = 0
if (!isNumber(user.centaur)) user.centaur = 0
if (!isNumber(user.centaurexp)) user.centaurexp = 0
if (!isNumber(user.centaurlastclaim)) user.centaurlastclaim = 0
if (!isNumber(user.centaurlastfeed)) user.centaurlastfeed = 0
if (!isNumber(user.clay)) user.clay = 0
if (!isNumber(user.coal)) user.coal = 0
if (!isNumber(user.coin)) user.coin = 0
if (!isNumber(user.fantasy)) user.fantasy = 0
if (!isNumber(user.common)) user.common = 0
if (!isNumber(user.crystal)) user.crystal = 0
if (!isNumber(user.cumi)) user.cumi = 0
if (!isNumber(user.cupon)) user.cupon = 0
if (!isNumber(user.diamond)) user.diamond = 3
if (!isNumber(user.dog)) user.dog = 0
if (!isNumber(user.dogexp)) user.dogexp = 0
if (!isNumber(user.doglastfeed)) user.doglastfeed = 0
if (!isNumber(user.dory)) user.dory = 0
if (!isNumber(user.dragon)) user.dragon = 0
if (!isNumber(user.dragonexp)) user.dragonexp = 0
if (!isNumber(user.dragonlastfeed)) user.dragonlastfeed = 0
if (!isNumber(user.emas)) user.emas = 0
if (!isNumber(user.emerald)) user.emerald = 0
if (!isNumber(user.enchant)) user.enchant = 0
if (!isNumber(user.esteh)) user.esteh = 0
if (!isNumber(user.exp)) user.exp = 0
if (!isNumber(user.expg)) user.expg = 0
if (!isNumber(user.exphero)) user.exphero = 0
if (!isNumber(user.eleksirb)) user.eleksirb = 0
if (!isNumber(user.emasbatang)) user.emasbatang = 0
if (!isNumber(user.emasbiasa)) user.emasbiasa = 0
if (!isNumber(user.fideos)) user.fideos = 0
if (!isNumber(user.fishingrod)) user.fishingrod = 0
if (!isNumber(user.fishingroddurability)) user.fishingroddurability = 0
if (!isNumber(user.fortress)) user.fortress = 0
if (!isNumber(user.fox)) user.fox = 0
if (!isNumber(user.foxexp)) user.foxexp = 0
if (!isNumber(user.foxlastfeed)) user.foxlastfeed = 0
if (!isNumber(user.fullatm)) user.fullatm = 0
if (!isNumber(user.fantasy)) user.fantasy = []
if (!isNumber(user.fantasy_character)) user.fantasy_character = 0
if (!isNumber(user.fantasy_character2)) user.fantasy_character2 = 0
if (!isNumber(user.fantasy_character3)) user.fantasy_character3 = 0
if (!isNumber(user.fantasy_character4)) user.fantasy_character4 = 0
if (!isNumber(user.fantasy_character5)) user.fantasy_character5 = 0
if (!isNumber(user.gadodado)) user.gadodado = 0
if (!isNumber(user.gajah)) user.gajah = 0
if (!isNumber(user.gamemines)) user.gamemines = false
if (!isNumber(user.ganja)) user.ganja = 0
if (!isNumber(user.gardenboxs)) user.gardenboxs = 0
if (!isNumber(user.gems)) user.gems = 0
if (!isNumber(user.glass)) user.glass = 0
if (!isNumber(user.glimit)) user.glimit = 15
if (!isNumber(user.glory)) user.glory = 0
if (!isNumber(user.gold)) user.gold = 0
if (!isNumber(user.griffin)) user.griffin = 0
if (!isNumber(user.griffinexp)) user.griffinexp = 0
if (!isNumber(user.griffinlastclaim)) user.griffinlastclaim = 0
if (!isNumber(user.griffinlastfeed)) user.griffinlastfeed = 0
if (!isNumber(user.gulai)) user.gulai = 0
if (!isNumber(user.gurita)) user.gurita = 0
if (!isNumber(user.harimau)) user.harimau = 0
if (!isNumber(user.haus)) user.haus = 100
if (!isNumber(user.healt)) user.healt = 100
if (!isNumber(user.health)) user.health = 100
if (!isNumber(user.healthmonster)) user.healthmonster = 0
if (!isNumber(user.healtmonster)) user.healtmonster = 0
if (!isNumber(user.hero)) user.hero = 1
if (!isNumber(user.herolastclaim)) user.herolastclaim = 0
if (!isNumber(user.hiu)) user.hiu = 0
if (!isNumber(user.horse)) user.horse = 0
if (!isNumber(user.horseexp)) user.horseexp = 0
if (!isNumber(user.horselastfeed)) user.horselastfeed = 0
if (!isNumber(user.ikan)) user.ikan = 0
if (!isNumber(user.ikanbakar)) user.ikanbakar = 0
if (!isNumber(user.intelligence)) user.intelligence = 0
if (!isNumber(user.iron)) user.iron = 0
if (!isNumber(user.jagung)) user.jagung = 0
if (!isNumber(user.jagungbakar)) user.jagungbakar = 0
if (!isNumber(user.jeruk)) user.jeruk = 0
if (!isNumber(user.joinlimit)) user.joinlimit = 1
if (!isNumber(user.judilast)) user.judilast = 0
if (!isNumber(user.kaleng)) user.kaleng = 0
if (!isNumber(user.kambing)) user.kambing = 0
if (!isNumber(user.kangkung)) user.kangkung = 0
if (!isNumber(user.kapak)) user.kapak = 0
if (!isNumber(user.kardus)) user.kardus = 0
if (!isNumber(user.katana)) user.katana = 0
if (!isNumber(user.katanadurability)) user.katanadurability = 0
if (!isNumber(user.kayu)) user.kayu = 0
if (!isNumber(user.kentang)) user.kentang = 0
if (!isNumber(user.kentanggoreng)) user.kentanggoreng = 0
if (!isNumber(user.kepiting)) user.kepiting = 0
if (!isNumber(user.kepitingbakar)) user.kepitingbakar = 0
if (!isNumber(user.kerbau)) user.kerbau = 0
if (!isNumber(user.kerjadelapan)) user.kerjadelapan = 0
if (!isNumber(user.kerjadelapanbelas)) user.kerjadelapanbelas = 0
if (!isNumber(user.kerjadua)) user.kerjadua = 0
if (!isNumber(user.kerjaduabelas)) user.kerjaduabelas = 0
if (!isNumber(user.kerjaduadelapan)) user.kerjaduadelapan = 0
if (!isNumber(user.kerjaduadua)) user.kerjaduadua = 0
if (!isNumber(user.kerjaduaempat)) user.kerjaduaempat = 0
if (!isNumber(user.kerjaduaenam)) user.kerjaduaenam = 0
if (!isNumber(user.kerjadualima)) user.kerjadualima = 0
if (!isNumber(user.kerjaduapuluh)) user.kerjaduapuluh = 0
if (!isNumber(user.kerjaduasatu)) user.kerjaduasatu = 0
if (!isNumber(user.kerjaduasembilan)) user.kerjaduasembilan = 0
if (!isNumber(user.kerjaduatiga)) user.kerjaduatiga = 0
if (!isNumber(user.kerjaduatujuh)) user.kerjaduatujuh = 0
if (!isNumber(user.kerjaempat)) user.kerjaempat = 0
if (!isNumber(user.kerjaempatbelas)) user.kerjaempatbelas = 0
if (!isNumber(user.kerjaenam)) user.kerjaenam = 0
if (!isNumber(user.kerjaenambelas)) user.kerjaenambelas = 0
if (!isNumber(user.kerjalima)) user.kerjalima = 0
if (!isNumber(user.kerjalimabelas)) user.kerjalimabelas = 0
if (!isNumber(user.kerjasatu)) user.kerjasatu = 0
if (!isNumber(user.kerjasebelas)) user.kerjasebelas = 0
if (!isNumber(user.kerjasembilan)) user.kerjasembilan = 0
if (!isNumber(user.kerjasembilanbelas)) user.kerjasembilanbelas = 0
if (!isNumber(user.kerjasepuluh)) user.kerjasepuluh = 0
if (!isNumber(user.kerjatiga)) user.kerjatiga = 0
if (!isNumber(user.kerjatigabelas)) user.kerjatigabelas = 0
if (!isNumber(user.kerjatigapuluh)) user.kerjatigapuluh = 0
if (!isNumber(user.kerjatujuh)) user.kerjatujuh = 0
if (!isNumber(user.kerjatujuhbelas)) user.kerjatujuhbelas = 0
if (!isNumber(user.korbanngocok)) user.korbanngocok = 0
if (!isNumber(user.kubis)) user.kubis = 0
if (!isNumber(user.kucing)) user.kucing = 0
if (!isNumber(user.kucinglastclaim)) user.kucinglastclaim = 0
if (!isNumber(user.kuda)) user.kuda = 0
if (!isNumber(user.kudalastclaim)) user.kudalastclaim = 0
if (!isNumber(user.kyubi)) user.kyubi = 0
if (!isNumber(user.kyubiexp)) user.kyubiexp = 0
if (!isNumber(user.kyubilastclaim)) user.kyubilastclaim = 0
if (!isNumber(user.kyubilastfeed)) user.kyubilastfeed = 0
if (!isNumber(user.labu)) user.labu = 0
if (!isNumber(user.laper)) user.laper = 100
if (!isNumber(user.lastadventure)) user.lastadventure = 0
if (!isNumber(user.lastbansos)) user.lastbansos = 0
if (!isNumber(user.lastberbru)) user.lastberbru = 0
if (!isNumber(user.lastberkebon)) user.lastberkebon = 0
if (!isNumber(user.lastbunga)) user.lastbunga = 0
if (!isNumber(user.lastbunuhi)) user.lastbunuhi = 0
if (!isNumber(user.lastcoins)) user.lastcoins = 0
if (!isNumber(user.lastclaim)) user.lastclaim = 0
if (!isNumber(user.lastcode)) user.lastcode = 0
if (!isNumber(user.lastcofre)) user.lastcofre = 0
if (!isNumber(user.lastcodereg)) user.lastcodereg = 0
if (!isNumber(user.lastcrusade)) user.lastcrusade = 0
if (!isNumber(user.lastdagang)) user.lastdagang = 0
if (!isNumber(user.lastdiamantes)) user.lastdiamantes = 0
if (!isNumber(user.lastduel)) user.lastduel = 0
if (!isNumber(user.lastdungeon)) user.lastdungeon = 0
if (!isNumber(user.lasteasy)) user.lasteasy = 0
if (!isNumber(user.lastfight)) user.lastfight = 0
if (!isNumber(user.lastfishing)) user.lastfishing = 0
if (!isNumber(user.lastgift)) user.lastgift = 0
if (!isNumber(user.crime)) user.crime = 0
if (!isNumber(user.lastgojek)) user.lastgojek = 0
if (!isNumber(user.lastgrab)) user.lastgrab = 0
if (!isNumber(user.lasthourly)) user.lasthourly = 0
if (!isNumber(user.halloween)) user.halloween = 0
if (!isNumber(user.lasthunt)) user.lasthunt = 0
if (!isNumber(user.lastIstigfar)) user.lastIstigfar = 0
if (!isNumber(user.lastjb)) user.lastjb = 0
if (!isNumber(user.lastkill)) user.lastkill = 0
if (!isNumber(user.lastlink)) user.lastlink = 0
if (!isNumber(user.lastlumber)) user.lastlumber = 0
if (!isNumber(user.lastmancingeasy)) user.lastmancingeasy = 0
if (!isNumber(user.lastmancingextreme)) user.lastmancingextreme = 0
if (!isNumber(user.lastmancinghard)) user.lastmancinghard = 0
if (!isNumber(user.lastmancingnormal)) user.lastmancingnormal = 0
if (!isNumber(user.lastmining)) user.lastmining = 0
if (!isNumber(user.lastmisi)) user.lastmisi = 0
if (!isNumber(user.lastmonthly)) user.lastmonthly = 0
if (!isNumber(user.lastmulung)) user.lastmulung = 0
if (!isNumber(user.lastnambang)) user.lastnambang = 0
if (!isNumber(user.lastnebang)) user.lastnebang = 0
if (!isNumber(user.lastngocok)) user.lastngocok = 0
if (!isNumber(user.lastngojek)) user.lastngojek = 0
if (!isNumber(user.lastopen)) user.lastopen = 0
if (!isNumber(user.lastpekerjaan)) user.lastpekerjaan = 0
if (!isNumber(user.lastpago)) user.lastpago = 0
if (!isNumber(user.lastpotionclaim)) user.lastpotionclaim = 0
if (!isNumber(user.lastrampok)) user.lastrampok = 0
if (!isNumber(user.lastramuanclaim)) user.lastramuanclaim = 0
if (!isNumber(user.lastrob)) user.lastrob = 0
if (!isNumber(user.lastroket)) user.lastroket = 0
if (!isNumber(user.lastsda)) user.lastsda = 0
if (!isNumber(user.lastseen)) user.lastseen = 0
if (!isNumber(user.lastSetStatus)) user.lastSetStatus = 0
if (!isNumber(user.lastsironclaim)) user.lastsironclaim = 0
if (!isNumber(user.lastsmancingclaim)) user.lastsmancingclaim = 0
if (!isNumber(user.laststringclaim)) user.laststringclaim = 0
if (!isNumber(user.lastswordclaim)) user.lastswordclaim = 0
if (!isNumber(user.lastturu)) user.lastturu = 0
if (!isNumber(user.lastwar)) user.lastwar = 0
if (!isNumber(user.lastwarpet)) user.lastwarpet = 0
if (!isNumber(user.lastweaponclaim)) user.lastweaponclaim = 0
if (!isNumber(user.lastweekly)) user.lastweekly = 0
if (!isNumber(user.lastwork)) user.lastwork = 0
if (!isNumber(user.legendary)) user.legendary = 0
if (!isNumber(user.lele)) user.lele = 0
if (!isNumber(user.leleb)) user.leleb = 0
if (!isNumber(user.lelebakar)) user.lelebakar = 0
if (!isNumber(user.leleg)) user.leleg = 0
if (!isNumber(user.level)) user.level = 0
if (!isNumber(user.limit)) user.limit = 15
if (!isNumber(user.limitjoinfree)) user.limitjoinfree = 1
if (!isNumber(user.lion)) user.lion = 0
if (!isNumber(user.lionexp)) user.lionexp = 0
if (!isNumber(user.lionlastfeed)) user.lionlastfeed = 0
if (!isNumber(user.lobster)) user.lobster = 0
if (!isNumber(user.lumba)) user.lumba = 0
if (!isNumber(user.magicwand)) user.magicwand = 0
if (!isNumber(user.magicwanddurability)) user.magicwanddurability = 0
if (!isNumber(user.makanancentaur)) user.makanancentaur = 0
if (!isNumber(user.makanangriffin)) user.makanangriffin = 0
if (!isNumber(user.makanankyubi)) user.makanankyubi = 0
if (!isNumber(user.makanannaga)) user.makanannaga = 0
if (!isNumber(user.makananpet)) user.makananpet = 0
if (!isNumber(user.makananphonix)) user.makananphonix = 0
if (!isNumber(user.spam)) user.spam = 0
if (!isNumber(user.makananserigala)) user.makananserigala = 0
if (!isNumber(user.mana)) user.mana = 0
if (!isNumber(user.mangga)) user.mangga = 0
if (!isNumber(user.money)) user.money = 150
if (!isNumber(user.monyet)) user.monyet = 0
if (!isNumber(user.mythic)) user.mythic = 0
if (!isNumber(user.naga)) user.naga = 0
if (!isNumber(user.nagalastclaim)) user.nagalastclaim = 0
if (!isNumber(user.net)) user.net = 0
if (!isNumber(user.nila)) user.nila = 0
if (!isNumber(user.nilabakar)) user.nilabakar = 0
if (!isNumber(user.note)) user.note = 0
if (!isNumber(user.ojekk)) user.ojekk = 0
if (!isNumber(user.oporayam)) user.oporayam = 0
if (!isNumber(user.orca)) user.orca = 0
if (!isNumber(user.pancing)) user.pancing = 0
if (!isNumber(user.pasangan)) user.pasangan = 0
if (!isNumber(user.pancingan)) user.pancingan = 1
if (!isNumber(user.panda)) user.panda = 0
if (!isNumber(user.paus)) user.paus = 0
if (!isNumber(user.pausbakar)) user.pausbakar = 0
if (!isNumber(user.pepesikan)) user.pepesikan = 0
if (!isNumber(user.pertambangan)) user.pertambangan = 0
if (!isNumber(user.pertanian)) user.pertanian = 0
if (!isNumber(user.pet)) user.pet = 0
if (!isNumber(user.petFood)) user.petFood = 0
if (!isNumber(user.phonix)) user.phonix = 0
if (!isNumber(user.phonixexp)) user.phonixexp = 0
if (!isNumber(user.phonixlastclaim)) user.phonixlastclaim = 0
if (!isNumber(user.phonixlastfeed)) user.phonixlastfeed = 0
if (!isNumber(user.pickaxe)) user.pickaxe = 0
if (!isNumber(user.pickaxedurability)) user.pickaxedurability = 0
if (!isNumber(user.pillhero)) user.pillhero = 0
if (!isNumber(user.pisang)) user.pisang = 0
if (!isNumber(user.pointxp)) user.pointxp = 0
if (!isNumber(user.potion)) user.potion = 0
if (!isNumber(user.psenjata)) user.psenjata = 0
if (!isNumber(user.psepick)) user.psepick = 0
if (!isNumber(user.ramuan)) user.ramuan = 0
if (!isNumber(user.ramuancentaurlast)) user.ramuancentaurlast = 0
if (!isNumber(user.ramuangriffinlast)) user.ramuangriffinlast = 0
if (!isNumber(user.ramuanherolast)) user.ramuanherolast = 0
if (!isNumber(user.ramuankucinglast)) user.ramuankucinglast = 0
if (!isNumber(user.ramuankudalast)) user.ramuankudalast = 0
if (!isNumber(user.ramuankyubilast)) user.ramuankyubilast = 0
if (!isNumber(user.ramuannagalast)) user.ramuannagalast = 0 // <-- si tuvieras un typo raro aquí, corrígelo a 'ramuannagalast'
if (!isNumber(user.ramuanphonixlast)) user.ramuanphonixlast = 0
if (!isNumber(user.ramuanrubahlast)) user.ramuanrubahlast = 0
if (!isNumber(user.ramuanserigalalast)) user.ramuanserigalalast = 0
if (!isNumber(user.reglast)) user.reglast = 0
if (!isNumber(user.rendang)) user.rendang = 0
if (!isNumber(user.rhinoceros)) user.rhinoceros = 0
if (!isNumber(user.rhinocerosexp)) user.rhinocerosexp = 0
if (!isNumber(user.rhinoceroslastfeed)) user.rhinoceroslastfeed = 0
if (!isNumber(user.robo)) user.robo = 0
if (!isNumber(user.roboxp)) user.roboxp = 0
if (!isNumber(user.rock)) user.rock = 0
if (!isNumber(user.roket)) user.roket = 0
if (!isNumber(user.roti)) user.roti = 0
if (!isNumber(user.rubah)) user.rubah = 0
if (!isNumber(user.rubahlastclaim)) user.rubahlastclaim = 0
if (!isNumber(user.rumahsakit)) user.rumahsakit = 0
if (!isNumber(user.sampah)) user.sampah = 0
if (!isNumber(user.sand)) user.sand = 0
if (!isNumber(user.sapi)) user.sapi = 0
if (!isNumber(user.sapir)) user.sapir = 0
if (!isNumber(user.seedbayam)) user.seedbayam = 0
if (!isNumber(user.seedbrokoli)) user.seedbrokoli = 0
if (!isNumber(user.seedjagung)) user.seedjagung = 0
if (!isNumber(user.seedkangkung)) user.seedkangkung = 0
if (!isNumber(user.seedkentang)) user.seedkentang = 0
if (!isNumber(user.seedkubis)) user.seedkubis = 0
if (!isNumber(user.seedlabu)) user.seedlabu = 0
if (!isNumber(user.seedtomat)) user.seedtomat = 0
if (!isNumber(user.seedwortel)) user.seedwortel = 0
if (!isNumber(user.serigala)) user.serigala = 0
if (!isNumber(user.serigalalastclaim)) user.serigalalastclaim = 0
if (!isNumber(user.shield)) user.shield = false
if (!isNumber(user.skillexp)) user.skillexp = 0
if (!isNumber(user.snlast)) user.snlast = 0
if (!isNumber(user.soda)) user.soda = 0
if (!isNumber(user.sop)) user.sop = 0
if (!isNumber(user.banco)) user.banco = 0
if (!isNumber(user.spammer)) user.spammer = 0
if (!isNumber(user.spinlast)) user.spinlast = 0
if (!isNumber(user.ssapi)) user.ssapi = 0
if (!isNumber(user.stamina)) user.stamina = 100
if (!isNumber(user.steak)) user.steak = 0
if (!isNumber(user.stick)) user.stick = 0
if (!isNumber(user.strength)) user.strength = 0
if (!user.mensaje) user.mensaje = 0
if (!isNumber(user.string)) user.string = 0
if (!isNumber(user.superior)) user.superior = 0
if (!isNumber(user.suplabu)) user.suplabu = 0
if (!isNumber(user.sushi)) user.sushi = 0
if (!isNumber(user.sword)) user.sword = 0
if (!isNumber(user.sworddurability)) user.sworddurability = 0
if (!isNumber(user.tigame)) user.tigame = 50
if (!isNumber(user.tiketcoin)) user.tiketcoin = 0
if (!isNumber(user.title)) user.title = 0
if (!isNumber(user.tomat)) user.tomat = 0
if (!user.packname) user.packname = null
if (!user.author) user.author = null
if (!isNumber(user.tprem)) user.tprem = 0
if (!isNumber(user.trash)) user.trash = 0
if (!isNumber(user.trofi)) user.trofi = 0
if (!isNumber(user.troopcamp)) user.troopcamp = 0
if (!isNumber(user.tumiskangkung)) user.tumiskangkung = 0
if (!isNumber(user.udang)) user.udang = 0
if (!isNumber(user.udangbakar)) user.udangbakar = 0
if (!isNumber(user.umpan)) user.umpan = 0
if (!isNumber(user.uncoommon)) user.uncoommon = 0
if (!isNumber(user.unreglast)) user.unreglast = 0
if (!isNumber(user.upgrader)) user.upgrader = 0
if (!isNumber(user.vodka)) user.vodka = 0
if (!isNumber(user.wallet)) user.wallet = 0
if (!isNumber(user.warn)) user.warn = 0
if (!isNumber(user.weapon)) user.weapon = 0
if (!isNumber(user.weapondurability)) user.weapondurability = 0
if (!isNumber(user.wolf)) user.wolf = 0
if (!isNumber(user.wolfexp)) user.wolfexp = 0
if (!isNumber(user.wolflastfeed)) user.wolflastfeed = 0
if (!isNumber(user.wood)) user.wood = 0
if (!isNumber(user.wortel)) user.wortel = 0
if (!user.lbars) user.lbars = '[▒▒▒▒▒▒▒▒▒]'
if (!user.job) user.job = 'Desempleo'
if (!user.premium) user.premium = false
if (!user.premium) user.premiumTime = 0
if (!user.rtrofi) user.rtrofi = 'Bronce'
} else
global.db.data.users[m.sender] = {
midLanguage: 0,
afk: -1,
afkReason: '',
reporte: 0,
name: m.name,
age: 0,
genero: 0,
identidad: 0,
pasatiempo: 0,
tiempo: 0,
miestado: 0,
descripcion: 0,
premLimit: 0,
agility: 16,
juegos: 0,
messageSpam: 0,
anakanjing: 0,
anakcentaur: 0,
anakgriffin: 0,
anakkucing: 0,
anakkuda: 0,
warnPv: false,
anakkyubi: 0,
anaknaga: 0,
anakpancingan: 0,
anakphonix: 0,
anakrubah: 0,
anakserigala: 0,
anggur: 0,
banco: 0,
mensaje: 0,
anjing: 0,
anjinglastclaim: 0,
antispam: 0,
antispamlastclaim: 0,
apel: 0,
aqua: 0,
arc: 0,
arcdurability: 0,
arlok: 0,
armor: 0,
armordurability: 0,
armormonster: 0,
as: 0,
atm: 0,
//autolevelup: true,
axe: 0,
axedurability: 0,
ayam: 0,
ayamb: 0,
ayambakar: 0,
ayamg: 0,
ayamgoreng: 0,
babi: 0,
babihutan: 0,
babipanggang: 0,
bandage: 0,
bank: 0,
packname: null,
author: null,
banned: false,
BannedReason: '',
Banneduser: false,
banteng: 0,
batu: 0,
bawal: 0,
bawalbakar: 0,
bayam: 0,
berlian: 10,
bibitanggur: 0,
bibitapel: 0,
bibitjeruk: 0,
bibitmangga: 0,
bibitpisang: 0,
botol: 0,
bow: 0,
bowdurability: 0,
boxs: 0,
brick: 0,
brokoli: 0,
buaya: 0,
buntal: 0,
cat: 0,
catlastfeed: 0,
catngexp: 0,
centaur: 0,
centaurexp: 0,
centaurlastclaim: 0,
centaurlastfeed: 0,
clay: 0,
coal: 0,
coin: 0,
common: 0,
crystal: 0,
cumi: 0,
cupon: 0,
diamond: 3,
dog: 0,
dogexp: 0,
doglastfeed: 0,
dory: 0,
dragon: 0,
dragonexp: 0,
dragonlastfeed: 0,
emas: 0,
emerald: 0,
esteh: 0,
exp: 0,
expg: 0,
exphero: 0,
expired: 0,
eleksirb: 0,
emasbatang: 0,
emasbiasa: 0,
fideos: 0,
fishingrod: 0,
fishingroddurability: 0,
fortress: 0,
fox: 0,
foxexp: 0,
foxlastfeed: 0,
fullatm: 0,
fantasy: [],
fantasy_character: 0,
fantasy_character2: 0,
fantasy_character3: 0,
fantasy_character4: 0,
fantasy_character5: 0,
gadodado: 0,
gajah: 0,
gamemines: false,
ganja: 0,
gardenboxs: 0,
gems: 0,
glass: 0,
gold: 0,
griffin: 0,
griffinexp: 0,
griffinlastclaim: 0,
griffinlastfeed: 0,
gulai: 0,
gurita: 0,
halloween: 0,
harimau: 0,
haus: 100,
healt: 100,
health: 100,
healtmonster: 100,
hero: 1,
herolastclaim: 0,
hiu: 0,
horse: 0,
horseexp: 0,
horselastfeed: 0,
ikan: 0,
ikanbakar: 0,
intelligence: 10,
iron: 0,
jagung: 0,
jagungbakar: 0,
jeruk: 0,
job: 'Pengangguran',
joincount: 1,
joinlimit: 1,
judilast: 0,
kaleng: 0,
kambing: 0,
kangkung: 0,
kapak: 0,
kardus: 0,
katana: 0,
katanadurability: 0,
kayu: 0,
kentang: 0,
kentanggoreng: 0,
kepiting: 0,
kepitingbakar: 0,
kerbau: 0,
kerjadelapan: 0,
kerjadelapanbelas: 0,
kerjadua: 0,
kerjaduabelas: 0,
kerjaduadelapan: 0,
kerjaduadua: 0,
kerjaduaempat: 0,
kerjaduaenam: 0,
kerjadualima: 0,
kerjaduapuluh: 0,
kerjaduasatu: 0,
kerjaduasembilan: 0,
kerjaduatiga: 0,
kerjaduatujuh: 0,
kerjaempat: 0,
kerjaempatbelas: 0,
kerjaenam: 0,
kerjaenambelas: 0,
kerjalima: 0,
kerjalimabelas: 0,
kerjasatu: 0,
kerjasebelas: 0,
kerjasembilan: 0,
kerjasembilanbelas: 0,
kerjasepuluh: 0,
kerjatiga: 0,
kerjatigabelas: 0,
kerjatigapuluh: 0,
kerjatujuh: 0,
kerjatujuhbelas: 0,
korbanngocok: 0,
kubis: 0,
kucing: 0,
kucinglastclaim: 0,
kuda: 0,
kudalastclaim: 0,
kumba: 0,
kyubi: 0,
kyubilastclaim: 0,
labu: 0,
laper: 100,
lastadventure: 0,
lastberbru: 0,
lastberkebon: 0,
lastbunga: 0,
lastbunuhi: 0,
lastcoins: 0,
lastclaim: 0,
lastcode: 0,
lastcofre: 0,
lastcrusade: 0,
lastdaang: 0,
lastdagang: 0,
lastdiamantes: 0,
lastduel: 0,
lastdungeon: 0,
lasteasy: 0,
lastfight: 0,
lastfishing: 0,
lastgojek: 0,
lastgrab: 0,
lasthourly: 0,
lasthunt: 0,
lastjb: 0,
lastkill: 0,
lastlink: 0,
lastlumber: 0,
lastmancingeasy: 0,
lastmancingextreme: 0,
lastmancinghard: 0,
lastmancingnormal: 0,
lastmining: 0,
lastmisi: 0,
lastmonthly: 0,
lastmulung: 0,
lastnambang: 0,
lastnebang: 0,
lastngocok: 0,
lastngojek: 0,
lastopen: 0,
lastpekerjaan: 0,
lastpago: 0,
lastpotionclaim: 0,
lastramuanclaim: 0,
lastrob: 0,
lastroket: 0,
lastseen: 0,
lastSetStatus: 0,
lastsironclaim: 0,
lastsmancingclaim: 0,
laststringclaim: 0,
lastswordclaim: 0,
lastturu: 0,
lastwarpet: 0,
lastweaponclaim: 0,
lastweekly: 0,
lastwork: 0,
lbars: '[▒▒▒▒▒▒▒▒▒]',
legendary: 0,
lele: 0,
leleb: 0,
lelebakar: 0,
leleg: 0,
level: 0,
limit: 15,
limitjoinfree: 1,
lion: 0,
lionexp: 0,
lionlastfeed: 0,
lobster: 0,
lumba: 0,
magicwand: 0,
magicwanddurability: 0,
makanan: 0,
makanancentaur: 0,
makanangriffin: 0,
makanankyubi: 0,
makanannaga: 0,
makananpet: 0,
makananphonix: 0,
makananserigala: 0,
mana: 0,
mangga: 0,
misi: '',
money: 100,
monyet: 0,
mythic: 0,
naga: 0,
nagalastclaim: 0,
net: 0,
nila: 0,
nilabakar: 0,
note: 0,
ojekk: 0,
oporayam: 0,
orca: 0,
pancingan: 1,
panda: 0,
pasangan: '',
paus: 0,
pausbakar: 0,
pepesikan: 0,
pet: 0,
phonix: 0,
phonixexp: 0,
phonixlastclaim: 0,
phonixlastfeed: 0,
pickaxe: 0,
pickaxedurability: 0,
pillhero: 0,
pisang: 0,
pointxp: 0,
potion: 10,
muto: false,
premium: false,
premiumTime: 0,
ramuan: 0,
ramuancentaurlast: 0,
ramuangriffinlast: 0,
ramuanherolast: 0,
ramuankucinglast: 0,
ramuankudalast: 0,
ramuankyubilast: 0,
ramuannagalast: 0,
ramuanphonixlast: 0,
ramuanrubahlast: 0,
ramuanserigalalast: 0,
registered: false,
registroR: false,
registroC: false,
reglast: 0,
regTime: -1,
rendang: 0,
rhinoceros: 0,
rhinocerosexp: 0,
rhinoceroslastfeed: 0,
rock: 0,
roket: 0,
role: 'Novato',
roti: 0,
rtrofi: 'bronce',
rubah: 0,
rubahlastclaim: 0,
rumahsakit: 0,
sampah: 0,
sand: 0,
sapi: 0,
sapir: 0,
seedbayam: 0,
seedbrokoli: 0,
seedjagung: 0,
seedkangkung: 0,
seedkentang: 0,
seedkubis: 0,
seedlabu: 0,
seedtomat: 0,
seedwortel: 0,
semangka: 0,
serigala: 0,
serigalalastclaim: 0,
sewa: false,
shield: 0,
skill: '',
skillexp: 0,
snlast: 0,
soda: 0,
sop: 0,
spammer: 0,
spinlast: 0,
ssapi: 0,
stamina: 100,
steak: 0,
stick: 0,
strength: 30,
string: 0,
stroberi: 0,
superior: 0,
suplabu: 0,
sushi: 0,
sword: 0,
sworddurability: 0,
tigame: 50,
tiketcoin: 0,
title: '',
tomat: 0,
tprem: 0,
trash: 0,
trofi: 0,
troopcamp: 0,
tumiskangkung: 0,
udang: 0,
udangbakar: 0,
umpan: 0,
uncoommon: 0,
unreglast: 0,
upgrader: 0,
vodka: 0,
wallet: 0,
warn: 0,
weapon: 0,
weapondurability: 0,
wolf: 0,
wolfexp: 0,
wolflastfeed: 0,
wood: 0,
wortel: 0
}
let akinator = global.db.data.users[m.sender].akinator
if (typeof akinator !== 'object') global.db.data.users[m.sender].akinator = {}
if (akinator) {
if (!('sesi' in akinator)) akinator.sesi = false
if (!('server' in akinator)) akinator.server = null
if (!('frontaddr' in akinator)) akinator.frontaddr = null
if (!('session' in akinator)) akinator.session = null
if (!('signature' in akinator)) akinator.signature = null
if (!('question' in akinator)) akinator.question = null
if (!('progression' in akinator)) akinator.progression = null
if (!('step' in akinator)) akinator.step = null
if (!('soal' in akinator)) akinator.soal = null
} else
global.db.data.users[m.sender].akinator = {
sesi: false,
server: null,
frontaddr: null,
session: null,
signature: null,
question: null,
progression: null,
step: null,
soal: null
}
let chat = global.db.data.chats[m.chat]
if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}

if (chat) {
if (!('isBanned' in chat)) chat.isBanned = false
if (!('welcome' in chat)) chat.welcome = true
if (!('detect' in chat)) chat.detect = false
if (!('sWelcome' in chat)) chat.sWelcome = ''
if (!('sBye' in chat)) chat.sBye = ''
if (!('sPromote' in chat)) chat.sPromote = ''
if (!('sDemote' in chat)) chat.sDemote = ''
if (!('sCondition' in chat)) chat.sCondition = ''
if (!('sAutorespond' in chat)) chat.sAutorespond = ''
if (!('delete' in chat)) chat.delete = false
if (!('modohorny' in chat)) chat.modohorny = true
if (!('stickers' in chat)) chat.stickers = false
if (!('autosticker' in chat)) chat.autosticker = false
if (!('audios' in chat)) chat.audios = true
if (!('antiver' in chat)) chat.antiver = false
if (!('antiPorn' in chat)) chat.antiPorn = true
if (!('antiLink' in chat)) chat.antiLink = false
if (!('antiLink2' in chat)) chat.antiLink2 = false
if (!('antiTiktok' in chat)) chat.antiTiktok = false
if (!('antiYoutube' in chat)) chat.antiYoutube = false
if (!('antiTelegram' in chat)) chat.antiTelegram = false
if (!('antiFacebook' in chat)) chat.antiFacebook = false
if (!('antiInstagram' in chat)) chat.antiInstagram = false
if (!('antiTwitter' in chat)) chat.antiTwitter = false
if (!('antiDiscord' in chat)) chat.antiDiscord = false
if (!('antiThreads' in chat)) chat.antiThreads = false
if (!('antiTwitch' in chat)) chat.antiTwitch = false
if (!('antifake' in chat)) chat.antifake = false
if (!('reaction' in chat)) chat.reaction = true
if (!('viewonce' in chat)) chat.viewonce = false
if (!('modoadmin' in chat)) chat.modoadmin = false
if (!('autorespond' in chat)) chat.autorespond = true
if (!('antitoxic' in chat)) chat.antitoxic = true
if (!('game' in chat)) chat.game = true
if (!('game2' in chat)) chat.game2 = true
if (!('simi' in chat)) chat.simi = false
if (!('antiTraba' in chat)) chat.antiTraba = true
if (!('primaryBot' in chat)) chat.primaryBot = null
if (!('autolevelup' in chat)) chat.autolevelup = true
if (!isNumber(chat.expired)) chat.expired = 0
if (!('horarioNsfw' in chat)) {
chat.horarioNsfw = {
inicio: '00:00',
fin: '23:59'
}
}
} else
global.db.data.chats[m.chat] = {
isBanned: false,
welcome: true,
detect: true,
sWelcome: '',
sBye: '',
sPromote: '',
sDemote: '',
sCondition: '',
sAutorespond: '',
delete: false,
modohorny: true,
stickers: false,
autosticker: false,
audios: false,
antiver: true,
antiPorn: true,
antiLink: false,
antiLink2: false,
antiTiktok: false,
antiYoutube: false,
antiTelegram: false,
antiFacebook: false,
antiInstagram: false,
antiTwitter: false,
antiDiscord: false,
antiThreads: false,
antiTwitch: false,
antifake: false,
reaction: true,
viewonce: false,
modoadmin: false,
autorespond: true,
antitoxic: true,
game: true,
game2: true,
simi: false,
antiTraba: true,
primaryBot: null,
autolevelup: true,
expired: 0,
horarioNsfw: {
inicio: '00:00',
fin: '23:59'
}
}
let settings = global.db.data.settings[this.user.jid]
if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
if (settings) {
if (!('self' in settings)) settings.self = false
if (!('autoread' in settings)) settings.autoread = false
if (!('autoread2' in settings)) settings.autoread2 = false
if (!('restrict' in settings)) settings.restrict = false
if (!('temporal' in settings)) settings.temporal = false
if (!('anticommand' in settings)) settings.anticommand = false
if (!('antiPrivate' in settings)) settings.antiPrivate = false
if (!('antiCall' in settings)) settings.antiCall = true
if (!('antiSpam' in settings)) settings.antiSpam = true
if (!('modoia' in settings)) settings.modoia = false
if (!('jadibotmd' in settings)) settings.jadibotmd = true
if (!('prefix' in settings)) settings.prefix = opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@'
} else
global.db.data.settings[this.user.jid] = {
self: false,
autoread: false,
autoread2: false,
restrict: false,
temporal: false,
antiPrivate: false,
antiCall: true,
antiSpam: true,
modoia: false,
anticommand: false,
prefix: opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@',
jadibotmd: true
}
} catch (e) {
console.error(e)
}

// [RAGE-fix] this block ends with a catch but its try was missing
try {
let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}

            if (chat) {
                if (!('isBanned' in chat)) chat.isBanned = false
                if (!('welcome' in chat)) chat.welcome = true
                if (!('detect' in chat)) chat.detect = false
                if (!('sWelcome' in chat)) chat.sWelcome = ''
                if (!('sBye' in chat)) chat.sBye = ''
                if (!('sPromote' in chat)) chat.sPromote = ''
                if (!('sDemote' in chat)) chat.sDemote = ''
                if (!('delete' in chat)) chat.delete = false
                if (!('stickers' in chat)) chat.stickers = false
                if (!('autosticker' in chat)) chat.autosticker = false
                if (!('audios' in chat)) chat.audios = true
                if (!('reaction' in chat)) chat.reaction = true
                if (!('viewonce' in chat)) chat.viewonce = false
                if (!('modoadmin' in chat)) chat.modoadmin = false
                if (!('autorespond' in chat)) chat.autorespond = true
                if (!('game' in chat)) chat.game = true
                if (!('game2' in chat)) chat.game2 = true
                if (!('simi' in chat)) chat.simi = false
                if (!('primaryBot' in chat)) chat.primaryBot = null
                if (!('antilink' in chat)) chat.antilink = false
                if (!isNumber(chat.expired)) chat.expired = 0
            } else {
                global.db.data.chats[m.chat] = {
                    isBanned: false,
                    welcome: true,
                    detect: true,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '',
                    sDemote: '',
                    delete: false,
                    stickers: false,
                    autosticker: false,
                    audios: false,
                    reaction: true,
                    viewonce: false,
                    modoadmin: false,
                    autorespond: true,
                    game: true,
                    game2: true,
                    simi: false,
                    primaryBot: null,
                    antilink: false,
                    expired: 0
                }
            }

            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!('self' in settings)) settings.self = false
                if (!('autoread' in settings)) settings.autoread = false
                if (!('restrict' in settings)) settings.restrict = false
                if (!('jadibotmd' in settings)) settings.jadibotmd = true
                if (!('prefix' in settings)) settings.prefix = opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@'
            } else {
                global.db.data.settings[this.user.jid] = {
                    self: false,
                    autoread: false,
                    restrict: false,
                    jadibotmd: true,
                    prefix: opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@'
                }
            }
        } catch (e) {
            console.error(e)
        }
        
var settings = global.db.data.settings[this.user.jid]
let prefix
const defaultPrefix = '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@' // Valor por defecto
if (settings.prefix) {
if (settings.prefix.includes(',')) {
const prefixes = settings.prefix.split(',').map((p) => p.trim())
prefix = new RegExp('^(' + prefixes.map((p) => p.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&')).join('|') + ')')
} else if (settings.prefix === defaultPrefix) {
prefix = new RegExp('^[' + settings.prefix.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']')
} else {
prefix = new RegExp('^' + settings.prefix.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&'))
}
} else {
prefix = new RegExp('') // Permite comandos sin prefijo
}
const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net'
// [RAGE-fix] v.replace crashed when global.owner holds arrays like [['2012...','name']]
// const isROwner = [...global.owner.map((number) => number)].map((v) => v.replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
const isROwner = [...global.owner.map((number) => number)].map((v) => String(Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
const isOwner = isROwner || m.fromMe
// const isMods = isOwner || global.mods.map((v) => v.replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
const isMods = isOwner || global.mods.map((v) => String(Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
//const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0

if (opts['queque'] && m.text && !(isMods || isPrems)) {
let queque = this.msgqueque,
time = 1000 * 5
const previousID = queque[queque.length - 1]
queque.push(m.id || m.key.id)
setInterval(async function () {
if (queque.indexOf(previousID) === -1) clearInterval(this)
await delay(time)
}, time)
}

if (
m.id.startsWith('EVO') ||
m.id.startsWith('Lyru-') ||
m.id.startsWith('EvoGlobalBot-') ||
(m.id.startsWith('BAE5') && m.id.length === 16) ||
m.id.startsWith('B24E') ||
(m.id.startsWith('8SCO') && m.id.length === 20) ||
m.id.startsWith('FizzxyTheGreat-')
)
return

if (opts['nyimak']) return
if (!isROwner && opts['self']) return
if (opts['pconly'] && m.chat.endsWith('g.us')) return
if (opts['gconly'] && !m.chat.endsWith('g.us')) return
if (opts['swonly'] && m.chat !== 'status@broadcast') return

// [RAGE-fix] اختيار من قائمة / زرار تفاعلي → تحويله لأمر
try {
  const im = m.message?.interactiveResponseMessage
  const lr = m.message?.listResponseMessage
  const br = m.message?.buttonsResponseMessage
  const tr = m.message?.templateButtonReplyMessage
  let picked = ''
  if (im?.nativeFlowResponseMessage?.paramsJson) {
    picked = JSON.parse(im.nativeFlowResponseMessage.paramsJson).id || ''
  } else if (lr) picked = lr.singleSelectReply?.selectedRowId || ''
  else if (br) picked = br.selectedButtonId || ''
  else if (tr) picked = tr.selectedId || ''
  if (picked) m.text = picked
} catch {}

if (typeof m.text !== 'string') m.text = ''

m.exp += Math.ceil(Math.random() * 10)
let usedPrefix
let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

const groupMetadata = m.isGroup
? (global.cachedGroupMetadata
? await global.cachedGroupMetadata(m.chat).catch((_) => null)
: await this.groupMetadata(m.chat).catch((_) => null)) || {}
: {}
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []

const decode = (j) => this.decodeJid(j)
const norm = (j) => jidNormalizedUser(decode(j))
const numOnly = (j) =>
String(decode(j))
.split('@')[0]
.replace(/[^0-9]/g, '')

const meIdRaw = this.user?.id || this.user?.jid // ej: 5215...:26@s.whatsapp.net
const meLidRaw = (this.user?.lid || conn?.user?.lid || '').toString().replace(/:.*/, '') || null // ej: 2064... (solo números)
const botNum = numOnly(meIdRaw)

const botCandidates = [
decode(meIdRaw),
jidNormalizedUser(decode(meIdRaw)),
botNum,
meLidRaw && `${meLidRaw}@lid`,
meLidRaw && jidNormalizedUser(`${meLidRaw}@lid`),
meLidRaw && `${meLidRaw}@s.whatsapp.net`
].filter(Boolean)

const senderCandidates = [decode(m.sender), jidNormalizedUser(decode(m.sender)), numOnly(m.sender)]

const participantsMap = {}
for (const p of participants) {
const raw = p.jid || p.id
const dj = decode(raw)
const nj = jidNormalizedUser(dj)
const no = numOnly(dj)
participantsMap[dj] = p
participantsMap[nj] = p
participantsMap[no] = p
}

const pick = (cands) => {
for (const k of cands) if (participantsMap[k]) return participantsMap[k]
// Fallback: comparación semántica por JID
return participants.find((p) => cands.some((c) => areJidsSameUser(norm(p.jid || p.id), jidNormalizedUser(decode(c))))) || null
}

const user = m.isGroup ? pick(senderCandidates) || {} : {}
const bot = m.isGroup ? pick(botCandidates) || {} : {}

const isRAdmin = user?.admin === 'superadmin'
const isAdmin = isRAdmin || user?.admin === 'admin' || user?.admin === true
const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin' || bot?.admin === true

m.isWABusiness = global.conn.authState?.creds?.platform === 'smba' || global.conn.authState?.creds?.platform === 'smbi'
m.isChannel = m.chat.includes('@newsletter') || m.sender.includes('@newsletter')

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

for (const name of getCandidatePlugins(this, m.text || '', prefix)) {
let plugin = global.plugins[name]
if (!plugin) continue
if (plugin.disabled) continue

const __filename = join(___dirname, name)

if (typeof plugin.all === 'function') {
try {
await plugin.all.call(this, m, {
chatUpdate,
__dirname: ___dirname,
__filename
})
} catch (e) {
console.error(e)
for (let [jid] of global.owner.filter((number, _, isDeveloper) => isDeveloper && number)) {
let data = (await conn.onWhatsApp(jid))[0] || {}
if (data.exists)
m.reply(
`${lenguajeGB['smsCont1']()}\n\n${lenguajeGB['smsCont2']()}\n*_${name}_*\n\n${lenguajeGB['smsCont3']()}\n*_${m.sender}_*\n\n${lenguajeGB['smsCont4']()}\n*_${m.text}_*\n\n${lenguajeGB['smsCont5']()}\n\`\`\`${format(e)}\`\`\`\n\n${lenguajeGB['smsCont6']()}`.trim(),
data.jid
)
}
}
}

// Respeta restrict: plugins tag 'admin' saltan si no hay restrict ON
if (!opts['restrict']) {
if (plugin.tags && plugin.tags.includes('admin')) {
continue
}
}

const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : prefix

let matchCandidates =
_prefix instanceof RegExp
? [[_prefix.exec(m.text), _prefix]]
: Array.isArray(_prefix)
? _prefix.map((p) => {
let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
return [re.exec(m.text), re]
})
: typeof _prefix === 'string'
? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
: [[null, null]]

// MUY IMPORTANTE: buscar un match real (p[0]), no el regex
let match = matchCandidates.find((p) => p[0])

if (typeof plugin.before === 'function') {
if (
await plugin.before.call(this, m, {
match,
conn: this,
participants,
groupMetadata,
user,
bot,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename
})
)
continue
}

if (typeof plugin !== 'function') continue

if (!match) continue

usedPrefix = (match[0] || [])[0] || ''
let noPrefix = m.text.slice(usedPrefix.length)
let [command, ...args] = noPrefix.trim().split(/\s+/).filter(Boolean)
args = args || []
let _args = noPrefix.trim().split(/\s+/).slice(1)
let text = _args.join(' ')
command = (command || '').toLowerCase()

let fail = plugin.fail || global.dfail
let isAccept =
plugin.command instanceof RegExp
? plugin.command.test(command)
: Array.isArray(plugin.command)
? plugin.command.some((cmd) => (cmd instanceof RegExp ? cmd.test(command) : cmd === command))
: typeof plugin.command === 'string'
? plugin.command === command
: false

if (!isAccept) continue
m.plugin = name

if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[m.sender]
if (!['owner-unbanchat.js'].includes(name) && chat && chat.isBanned && !isROwner) return
if (
name != 'owner-unbanchat.js' &&
name != 'owner-exec.js' &&
name != 'owner-exec2.js' &&
name != 'tool-delete.js' &&
chat?.isBanned &&
!isROwner
)
return
if (m.text && user.banned && !isROwner) {
if (user.antispam > 2) return
m.reply(
`🚫 *ESTÁ BANEADO(A), NO PUEDE USAR LOS COMANDOS*\n📑 *MOTIVO: ${user.messageSpam === 0 ? 'NO ESPECIFICADO' : user.messageSpam}*\n⚠️ \`\`\`SI ESTE BOT ES CUENTA OFICIAL Y TIENE EVIDENCIA QUE RESPALDE QUE ESTE MENSAJE ES UN ERROR, PUEDE EXPONER SU CASO EN:\`\`\`👉 *${ig}*\n👉 ${asistencia}`
)
user.antispam++
return
}
if (user.antispam2 && isROwner) return
let time = global.db.data.users[m.sender].spam + 3000
if (new Date() - global.db.data.users[m.sender].spam < 3000) {
console.log('[ SPAM ]')
continue
}
global.db.data.users[m.sender].spam = new Date() * 1
}

let hl = _prefix
let adminMode = global.db.data.chats[m.chat].modoadmin
let gata = `${plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || hl || m.text.slice(0, 1) == hl || plugin.command}`
if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && gata) continue

if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
fail('owner', m, this)
continue
}
if (plugin.rowner && !isROwner) {
fail('rowner', m, this)
continue
}
if (plugin.owner && !isOwner) {
fail('owner', m, this)
continue
}
if (plugin.mods && !isMods) {
fail('mods', m, this)
continue
}
if (plugin.premium && !isPrems) {
fail('premium', m, this)
continue
}
if (plugin.group && !m.isGroup) {
fail('group', m, this)
continue
} else if (plugin.botAdmin && !isBotAdmin) {
fail('botAdmin', m, this)
continue
} else if (plugin.admin && !isAdmin) {
fail('admin', m, this)
continue
}
if (plugin.private && m.isGroup) {
fail('private', m, this)
continue
}
if (plugin.register == true && _user.registered == false) {
fail('unreg', m, this)
continue
}

m.isCommand = true
let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
if (xp > 2000) {
m.reply('Exp limit')
continue
}

if (!isPrems && plugin.money && global.db.data.users[m.sender].money < plugin.money * 1) {
this.sendMessage(
m.chat,
{
text: '𝗥𝗔𝗚𝗘 ',
contextInfo: {
externalAdReply: {
mediaUrl: null,
mediaType: 1,
description: null,
title: gt,
body: ' 𝗥𝗔𝗚𝗘  ',
previewType: 0,
thumbnail: gataImg,
sourceUrl: accountsgb
}
}
},
{quoted: m}
)
continue
}

m.exp += xp
if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
this.sendMessage(
m.chat,
{
text: `${lenguajeGB['smsCont7']()} *${usedPrefix}buy*`,
contextInfo: {
externalAdReply: {
mediaUrl: null,
mediaType: 1,
description: null,
title: gt,
body: ' 𝗥𝗔𝗚𝗘  ',
previewType: 0,
thumbnail: gataImg,
sourceUrl: accountsgb
}
}
},
{quoted: m}
)
continue
}
if (plugin.level > _user.level) {
this.sendMessage(
m.chat,
{
text: `${lenguajeGB['smsCont9']()} *${plugin.level}* ${lenguajeGB['smsCont10']()} *${_user.level}* ${lenguajeGB['smsCont11']()} *${usedPrefix}nivel*`,
contextInfo: {
externalAdReply: {
mediaUrl: null,
mediaType: 1,
description: null,
title: gt,
body: ' 𝗥𝗔𝗚𝗘  ',
previewType: 0,
thumbnail: gataImg,
sourceUrl: accountsgb
}
}
},
{quoted: m}
)
continue
}

let extra = {
match,
usedPrefix,
noPrefix,
_args,
args,
command,
text,
conn: this,
participants,
groupMetadata,
user,
bot,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename
}
try {
await plugin.call(this, m, extra)
if (!isPrems) m.limit = m.limit || plugin.limit || false
m.money = m.money || plugin.money || false
} catch (e) {
m.error = e
console.error(e)
if (e) {
let text = format(e) || 'Error desconocido'
for (let api in global.APIs) {
let key = global.APIs[api].key
if (key) text = text.replace(new RegExp(key, 'g'), 'Admin')
}
if (e.name)
for (let [jid] of global.owner.filter((number, _, isDeveloper) => isDeveloper && number)) {
let data = (await conn.onWhatsApp(jid))[0] || {}
if (data.exists)
m.reply(
`${lenguajeGB['smsCont1']()}\n\n${lenguajeGB['smsCont2']()}\n*_${name}_*\n\n${lenguajeGB['smsCont3']()}\n*_${m.sender}_*\n\n${lenguajeGB['smsCont4']()}\n*_${m.text}_*\n\n${lenguajeGB['smsCont5']()}\n\`\`\`${format(e)}\`\`\`\n\n${lenguajeGB['smsCont6']()}`.trim(),
data.jid
)
}
m.reply(text)
}
} finally {
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(this, m, extra)
} catch (e) {
console.error(e)
}
}
if (m.limit) m.reply(+m.limit + lenguajeGB.smsCont8())
}
if (m.money) m.reply(+m.money + ' 𝗥𝗔𝗚𝗘 ')
break
}
} catch (e) {
console.error(e)
} finally {
if (opts['queque'] && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
}
//console.log(global.db.data.users[m.sender])
let user,
stats = global.db.data.stats
if (m) {
let utente = global.db.data.users[m.sender]
if (utente.muto == true) {
let bang = m.key.id
let cancellazzione = m.key.participant
await conn.sendMessage(m.chat, {
delete: {
remoteJid: m.chat,
fromMe: false,
id: bang,
participant: cancellazzione
}
})
}
if (m.sender && (user = global.db.data.users[m.sender])) {
user.exp += m.exp
user.limit -= m.limit * 1
user.money -= m.money * 1
}

let stat
if (m.plugin) {
let now = +new Date()
if (m.plugin in stats) {
stat = stats[m.plugin]
if (!isNumber(stat.total)) stat.total = 1
if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
if (!isNumber(stat.last)) stat.last = now
if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
} else
stat = stats[m.plugin] = {
total: 1,
success: m.error != null ? 0 : 1,
last: now,
lastSuccess: m.error != null ? 0 : now
}
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}
}
}


const REACTIONS = ['😀', '😂', '🥰', '😎', '🤩', '🥳', '😏', '🤔', '🫡', '🤝', '🔥', '✨', '⚡', '💎', '🌈', '❤️', '💚', '💙', '👑', '🗿', '👀', '🫶', '👍', '🙏']
const REACTION_WORDS = /(ción|dad|aje|oso|izar|mente|البوت|بوتات|بوت|tion|age|ate|ify)/i
try {
if (!opts['noprint']) await (await import('./lib/print.js')).default(m, this)
} catch (e) {
console.log(m, m.quoted, e)
}
let settingsREAD = global.db.data.settings[this.user.jid] || {}
if (opts['autoread']) await this.readMessages([m.key])
if (settingsREAD.autoread2) await this.readMessages([m.key])
//if (settingsREAD.autoread2 == 'true') await this.readMessages([m.key])

// [RAGE-fix] `db` is the jsonion class here, the bot database is global.db
// if (db.data.chats[m.chat].reaction && m.text.match(/(ción|dad|aje|oso|izar|mente|البوت|tion|age|بوتات|ate|and|بوت|ify)/gi)) {
if (global.db.data.chats[m.chat].reaction && m.text.match(/(ción|dad|aje|oso|izar|mente|البوت|tion|age|بوتات|ate|and|بوت|ify)/gi)) {
let emot = pickRandom([
'😀',
'😃',
'😄',
'😁',
'😆',
'🥹',
'😅',
'😂',
'🤣',
'🥲',
'☺️',
'😊',
'😇',
'🙂',
'🙃',
'😉',
'😌',
'😍',
'🥰',
'😘',
'😗',
'😙',
'😚',
'😋',
'😛',
'😝',
'😜',
'🤪',
'🤨',
'🧐',
'🤓',
'😎',
'🥸',
'🤩',
'🥳',
'😏',
'😒',
'😞',
'😔',
'😟',
'😕',
'🙁',
'☹️',
'😣',
'😖',
'😫',
'😩',
'🥺',
'😢',
'😭',
'😤',
'😠',
'😡',
'🤬',
'🤯',
'😳',
'🥵',
'🥶',
'😶‍🌫️',
'😱',
'😨',
'😰',
'😥',
'😓',
'🤗',
'🤔',
'🫣',
'🤭',
'🫢',
'🫡',
'🤫',
'🫠',
'🤥',
'😶',
'🫥',
'😐',
'🫤',
'😑',
'🫨',
'😬',
'🙄',
'😯',
'😦',
'😧',
'😮',
'😲',
'🥱',
'😴',
'🤤',
'😪',
'😮‍💨',
'😵',
'😵‍💫',
'🤐',
'🥴',
'🤢',
'🤮',
'🤧',
'😷',
'🤒',
'🤕',
'🤑',
'🤠',
'😈',
'👿',
'👺',
'🤡',
'💩',
'👻',
'😺',
'😸',
'😹',
'😻',
'😼',
'😽',
'🙀',
'😿',
'😾',
'🫶',
'👍',
'✌️',
'🙏',
'🫵',
'🤏',
'🤌',
'☝️',
'🖕',
'🙏',
'🫵',
'🫂',
'🐱',
'🤹‍♀️',
'🤹‍♂️',
'🗿',
'✨',
'⚡',
'🔥',
'🌈',
'🩷',
'❤️',
'🧡',
'💛',
'💚',
'🩵',
'💙',
'💜',
'🖤',
'🩶',
'🤍',
'🤎',
'💔',
'❤️‍🔥',
'❤️‍🩹',
'❣️',
'💕',
'💞',
'💓',
'💗',
'💖',
'💘',
'💝',
'🏳️‍🌈',
'👊',
'👀',
'💋',
'🫰',
'💅',
'👑',
'🐣',
'🐤',
'🐈'
])
if (!m.fromMe) return this.sendMessage(m.chat, {react: {text: emot, key: m.key}})
}
function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}
}
}

/**
 * Handle groups participants update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate
 */
export async function participantsUpdate({id, participants, action}) {
if (opts['self']) return
// if (id in conn.chats) return // First login will spam
if (this.isInit) return
if (global.db.data == null) await loadDatabase()
let chat = global.db.data.chats[id] || {}
let text = ''
switch (action) {
case 'add':
case 'remove':
if (chat.welcome) {
let groupMetadata = (await this.groupMetadata(id)) || (conn.chats[id] || {}).metadata
for (let user of participants) {
let pp = global.gataImg
try {
pp = await this.profilePictureUrl(user, 'image')
} catch (e) {
} finally {
let apii = await this.getFile(pp)
const botTt2 = groupMetadata.participants.find((u) => this.decodeJid(u.id) == this.user.jid) || {}
const isBotAdminNn = botTt2?.admin === 'admin' || false
text = (
action === 'add'
? (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!')
.replace('@subject', await this.getName(id))
.replace('@desc', groupMetadata.desc?.toString() || '𝗥𝗔𝗚𝗘 ')
: chat.sBye || this.bye || conn.bye || 'Bye, @user!'
).replace('@user', '@' + user.split('@')[0])

if (chat.antifake && isBotAdminNn && action === 'add') {
const prefijosPredeterminados = [2, 4, 6, 7, 8, 9]
let prefijos =
(Array.isArray(chat.sCondition) && chat.sCondition.length > 0) || chat.sCondition !== '' ? chat.sCondition : prefijosPredeterminados
const comienzaConPrefijo = prefijos.some((prefijo) => user.startsWith(`+${prefijo}`))
if (comienzaConPrefijo) {
let texto = mid.mAdvertencia + mid.mFake2(user)
await conn.sendMessage(id, {text: texto, mentions: [user]})
// [RAGE-fix] `m` is not defined in participantsUpdate (ReferenceError)
// if (m.key.participant && m.key.id) {
if (typeof m !== 'undefined' && m?.key?.participant && m.key.id) {
await conn.sendMessage(id, {
delete: {
remoteJid: m.chat,
fromMe: false,
id: m.key.id,
participant: m.key.participant
}
})
}
}
}

let fkontak2 = {
key: {
participants: '0@s.whatsapp.net',
remoteJid: 'status@broadcast',
fromMe: false,
id: 'Halo'
},
message: {
contactMessage: {
vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${user.split('@')[0]}:${user.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
}
},
participant: '0@s.whatsapp.net'
}
this.sendMessage(
id,
{
text: text,
contextInfo: {
forwardingScore: 9999999,
isForwarded: true,
mentionedJid: [user],
externalAdReply: {
showAdAttribution: true,
renderLargerThumbnail: true,
thumbnail: apii.data,
title: [wm, '💠 ' + gt + ' ', '🌟 𝗥𝗔𝗚𝗘 '].getRandom(),
containsAutoReply: true,
mediaType: 1,
sourceUrl: 'https://github.com/riyad90/MashBot-MD'
}
}
},
{quoted: fkontak2}
)
apii.data = ''
}
}
}

break
case 'promote':
case 'daradmin':
case 'darpoder':
text = chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```'
case 'demote':
case 'quitarpoder':
case 'quitaradmin':
if (!text) text = chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```'
text = text.replace('@user', '@' + participants[0].split('@')[0])
if (chat.detect)
//this.sendMessage(id, { text, mentions: this.parseMention(text) })
break
}
}

/**
 * Handle groups update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate
 */
export async function groupsUpdate(groupsUpdate) {
// [RAGE-fix] isROwner is not defined in this function (ReferenceError)
// if (opts['self'] && !isOwner && !isROwner) return
if (opts['self']) return
for (const groupUpdate of groupsUpdate) {
const id = groupUpdate.id
if (!id) continue
let chats = global.db.data?.chats?.[id],
text = ''
if (!chats?.detect) continue
// if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
//if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
//if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
//if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
if (!text) continue
await this.sendMessage(id, {text, mentions: this.parseMention(text)})
}
}

export async function callUpdate(callUpdate) {
const botJid = this.user?.jid || (this.user?.id ? this.user.id.split(':')[0] + '@s.whatsapp.net' : null)
const isAnticall = global.db?.data?.settings?.[botJid]?.antiCall
if (!isAnticall) return
for (let nk of callUpdate || []) {
if (nk.isGroup == false && nk.status == 'offer') {
try {
const from = nk.from
await this.sendMessage(from, {
text: `*@${from.split('@')[0]}* ${nk.isVideo ? 'مكالمات الفيديو' : 'المكالمات'} غير مسموحة، سيتم حظرك.`,
mentions: [from]
})
await this.updateBlockStatus(from, 'block')
} catch (e) {
console.error('callUpdate:', e.message)
}
}
}
}

export async function deleteUpdate(item) {
try {
// messages.delete بيبعت إما { keys: [...] } أو { jid, all: true }
const keys = Array.isArray(item?.keys) ? item.keys : item?.key ? [item.key] : []
for (const key of keys) {
const { fromMe, id, participant, remoteJid } = key
if (fromMe || !id || !remoteJid) continue
const isGroup = remoteJid.endsWith('@g.us')
const isPrivate = !isGroup && (remoteJid.endsWith('@s.whatsapp.net') || remoteJid.endsWith('@lid'))
if (!isGroup && !isPrivate) continue
const chat = global.db?.data?.chats?.[remoteJid] || {}
if (!chat.delete) continue
const raw = await this.loadMessage(id)
if (!raw) continue
const msg = this.serializeM(raw)
const sender = participant || msg?.sender || remoteJid
const text = `*╭━━⬣ مـضـاد الـحـذف ⬣━━ 𓃠*\nالمستخدم @${sender.split('@')[0]} حذف رسالة\n*╰━━━⬣ مـضـاد الـحـذف ⬣━━╯*`
await this.sendMessage(remoteJid, { text, mentions: [sender] }, { quoted: msg })
await this.copyNForward(remoteJid, raw).catch((e) => console.log(e))
}
} catch (e) {
console.error(e)
}
}

global.dfail = (type, m, conn) => {

let msg = {
 rowner: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هذا الأمـر مخصص لـلمـطـور الـرئـيـسـي فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  owner: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر مخصص لـلمـالـك فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  mods: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر مخصص لـلمـشـرفـيـن فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  premium: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر مخصص لأعضاء ❪VIP❫ فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  group: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر يعمل في المجـمـو؏ـات فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  private: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر يعمل في الخاص فقط ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  admin: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر مخصص لمشرفي المجموعـة ✧\n +*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  botAdmin: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ يجب أن يكون البوت أدمن لتفعيل هذا الأمر ✧\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  unreg: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ⇇ يجب أن تكون مسجل لاستخدام هذا الأمر\n  ┊•⪼ استخدم الأمر: .تسجيل اسمك.عمرك\n + ┊•⪼ مثال: .تسجيل رياض.19\n*〄━═─━━⌬《•🌗•》⌬━━─═━〄*',
  restrict: '*〄━═─━━⌬《•🌗•》⌬━━─═━〄*\n  ┊ׁ۪❈ֺ۪┊ִׁ✧ هـذا الأمـر مغلق من طرف المطور ✧\n*〄━═─━━⌬《🌗》⌬━━─═━〄*'
}[type]

if (msg) return conn.reply(
  m.chat,
  msg,
  m,
  {
    contextInfo: {
      externalAdReply: {
        title: '📖 ' + (global.saludo || '') + ' ' + (global.nombre || ''),
        body: global.dev || '',
        sourceUrl: global.channel || '',
        thumbnailUrl: typeof random1 === 'function' ? random1() : ''
      }
    }
  }
)

}