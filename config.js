import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

const __configDir = path.dirname(fileURLToPath(import.meta.url))

// Reads a file next to config.js. If it is missing, returns an empty Buffer
// instead of crashing the whole bot.
const readSafe = (name) => {
  try {
    return fs.readFileSync(path.join(__configDir, name))
  } catch {
    console.warn(chalk.yellow(`[config] ${name} not found (using empty image)`))
    return Buffer.alloc(0)
  }
}

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// [ES] > Agrega el número que será Bot y los que serán propietarios.
// [EN] > Add the number that will be Bot and those that will be owners.
// Format: [number, name, isDeveloper]
global.owner = [
  ['79505344080', 'Ridin', true],
  ['201221579275', 'Owner', true],
  ['18737284047', 'Owner', true]
]

global.mods = []
global.prems = []

//cambia a false Desactivar en "auto-reconexion" de sub-bots
global.MashJadibts = true

// Cambiar a false para usar el Bot desde el mismo numero del Bot.
global.isBaileysFail = false
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰❰ RENDER ❱❱
//Kurt18: Obtener el código QR por la URL del Hosting
global.obtenerQrWeb = 0 //Solo valores: 1 o 0
//Kurt18: Aplica para Host Render.com
global.keepAliveRender = 0 //Solo valores: 1 o 0
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰❰ methodCode ❱❱
global.botNumberCode = '' //example: "+59309090909"
global.confirmCode = '' // No tocar esto : Do not touch this line
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰❰ Multi Idioma Dinámico : Dynamic Multi Language (MID-GB) ❱❱
global.libreria = 'Baileys'
global.baileys = 'V 6.7.16'
global.languaje = 'Arabic'
global.vs = '2.2.0'
global.nameqr = 'Mash-Bot-MD'
global.namebot = '꒰ ⃝𝗡𝗜𝗩𝗬 𝗕𝗢𝗧َ'
global.Mashsession = 'Mashsession'
global.jadi = 'Mashjadibts'
global.MashJadibts = true
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰❰ API KEYS ❱❱
global.baileys = '@whiskeysockets/baileys'
global.apis = 'https://api.delirius.store'

global.APIs = {
  lolhuman: {url: 'https://api.lolhuman.xyz/api', key: 'MashDiosV3'},
  stellar: {url: 'https://api.stellarwa.xyz', key: 'Mash'},
  skizo: {url: 'https://skizo.tech/api', key: 'Mash'},
  alyachan: {url: 'https://api.alyachan.dev/api', key: null},
  exonity: {url: 'https://exonity.tech/api', key: 'Mash'},
  ryzendesu: {url: 'https://api.ryzendesu.vip/api', key: null},
  neoxr: {url: 'https://api.neoxr.eu/api', key: 'Mash'},
  davidcyriltech: {url: 'https://api.davidcyriltech.my.id', key: null},
  dorratz: {url: 'https://api.dorratz.com', key: null},
  siputzx: {url: 'https://api.siputzx.my.id/api', key: null},
  vreden: {url: 'https://api.vreden.web.id/api', key: null},
  fgmods: {url: 'https://api.fgmods.xyz/api', key: 'elrebelde21'},
  popcat: {url: 'https://api.popcat.xyz', key: null}
}
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰❰ bibliotecas : libraries ❱❱
global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// Collaborators / owners shown in the contact list command
global.official = [
  ['79505344080', 'NIVY 💻', 1],
  ['79505344080', 'BY-NIVY 💻', 1],
  ['79505344080', 'BY-NIVY 💻', 1]
]

global.mail = '' // Add email
global.desc = '' // Add short description (20 caractres max)
global.desc2 = '' // Add long description (90 caractres max)
global.country = '' // Add country, example: 🇪🇨
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

global.packname = 'BY: NIVY'
global.author = 'BY: NIVY'

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
global.vs = '1.7.0'
global.vsJB = 'الاصدار الاحدث'
global.gt = 'BY: RIYAD'
global.imagen = readSafe('Menu2.jpg')

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

global.rg = '*╰⊱✅⊱الــنــتــائــج✅⊱╮*\n'
global.resultado = rg

global.ag = '*╰⊱⚠️⊱تــحــذيــر⚠️⊱╮*\n'
global.advertencia = ag

global.iig = '*╰⊱❕⊱مــعــلــومــات⊱⊱╮*\n'
global.informacion = iig

global.fg = '*╰⊱❌خــطــأ❌⊱╮**\n'
global.fallo = fg

global.mg = '*╰⊱❗️⊱اســتخــدام خــاطــئ❗️⊱╮*\n'
global.mal = mg

global.eeg = '*╰⊱📩⊱تــقــريــر📩⊱╮*\n'
global.envio = eeg

global.eg = '*╰⊱💚خــروج💚⊱╮*\n'
global.exito = eg

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
global.wm = 'BY: RIYAD'
global.igfg = 'BY: RIYAD'
global.nomorown = '201021902759'
global.pdoc = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/msword',
  'application/pdf',
  'text/rtf'
]
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
// ❰ RPG ❱
global.flaaa = [
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&script=water-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextColor=%23000&shadowGlowColor=%23000&backgroundColor=%23000&text=',
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=crafts-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&text=',
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=amped-logo&doScale=true&scaleWidth=800&scaleHeight=500&text=',
  'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&text=',
  'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextType=1&fillTextPattern=Warning!&fillColor1Color=%23f2aa4c&fillColor2Color=%23f2aa4c&fillColor3Color=%23f2aa4c&fillColor4Color=%23f2aa4c&fillColor5Color=%23f2aa4c&fillColor6Color=%23f2aa4c&fillColor7Color=%23f2aa4c&fillColor8Color=%23f2aa4c&fillColor9Color=%23f2aa4c&fillColor10Color=%23f2aa4c&fillOutlineColor=%23f2aa4c&fillOutline2Color=%23f2aa4c&backgroundColor=%23101820&text='
]

global.cmenut = '❖––––––『'
global.cmenub = '┊✦ '
global.cmenuf = '╰━═┅═━––––––๑\n'
global.cmenua = '\n⌕ ❙❘❙❙❘❙❚❙❘❙❙❚❙❘❙❘❙❚❙❘❙❙❚❙❘❙❙❘❙❚❙❘ ⌕\n     '

global.dmenut = '*❖─┅──┅〈*'
global.dmenub = '*┊»*'
global.dmenub2 = '*┊*'
global.dmenuf = '*╰┅────────┅✦*'
global.htjava = '⫹⫺'

global.htki = '*⭑•̩̩͙⊱•••• ☪*'
global.htka = '*☪ ••••̩̩͙⊰•⭑*'

global.comienzo = '• • ◕◕════'
global.fin = ' • •'

global.botdate = `⫹⫺ Date :  ${moment.tz('America/Los_Angeles').format('DD/MM/YY')}`
global.bottime = `𝗧 𝗜 𝗠 𝗘 : ${moment.tz('America/Los_Angeles').format('HH:mm:ss')}`
global.fgif = {
  key: {
    participant: '0@s.whatsapp.net'
  },
  message: {
    videoMessage: {
      title: wm,
      h: 'Hmm',
      seconds: '999999999',
      gifPlayback: 'true',
      caption: bottime,
      jpegThumbnail: global.imagen
    }
  }
}

global.multiplier = 85 // Cuanto más alto, más difícil subir de nivel

//Emojis RPG - Referencias
global.rpg = {
  emoticon(string) {
    string = string.toLowerCase()
    let emot = {
      level: '🧬 Nivel : Level',
      limit: lenguajeGB.eDiamante(),
      exp: lenguajeGB.eExp(),
      bank: '🏦 Banco : Bank',
      diamond: lenguajeGB.eDiamantePlus(),
      health: '❤️ Salud : Health',
      kyubi: lenguajeGB.eMagia(),
      joincount: lenguajeGB.eToken(),
      emerald: lenguajeGB.eEsmeralda(),
      stamina: lenguajeGB.eEnergia(),
      role: '💪 Rango | Role',
      premium: '🎟️ Premium',
      pointxp: '📧 Puntos Exp : Point Xp',
      gold: lenguajeGB.eOro(),

      trash: lenguajeGB.eBasura(),
      crystal: '🔮 Cristal : Crystal',
      intelligence: '🧠 Inteligencia : Intelligence',
      string: lenguajeGB.eCuerda(),
      keygold: '🔑 Llave de Oro : Key Gold',
      keyiron: '🗝️ Llave de Hierro : Key Iron',
      emas: lenguajeGB.ePinata(),
      fishingrod: '🎣 Caña de Pescar : Fishing Rod',
      gems: '🍀 Gemas : Gemas',
      magicwand: '⚕️ Varita Mágica : Magic Wand',
      mana: '🪄 Hechizo : Spell',
      agility: '🤸‍♂️ Agilidad : Agility',
      darkcrystal: '♠️ Cristal Oscuro : Dark Glass',
      iron: lenguajeGB.eHierro(),
      rock: lenguajeGB.eRoca(),
      potion: lenguajeGB.ePocion(),
      superior: '💼 Superior : Superior',
      robo: '🚔 Robo : Robo',
      upgrader: '🧰 Aumentar Mejora : Upgrade',
      wood: lenguajeGB.eMadera(),

      strength: '🦹‍ ♀️ Fuerza : Strength',
      arc: '🏹 Arco : Arc',
      armor: '🥼 Armadura : Armor',
      bow: '🏹 Super Arco : Super Bow',
      pickaxe: '⛏️ Pico : Peak',
      sword: lenguajeGB.eEspada(),

      common: lenguajeGB.eCComun(),
      uncoommon: lenguajeGB.ePComun(),
      mythic: lenguajeGB.eCMistica(),
      legendary: lenguajeGB.eClegendaria(),
      petFood: lenguajeGB.eAMascots(), //?
      pet: lenguajeGB.eCMascota(), //?

      bibitanggur: lenguajeGB.eSUva(),
      bibitapel: lenguajeGB.eSManzana(),
      bibitjeruk: lenguajeGB.eSNaranja(),
      bibitmangga: lenguajeGB.eSMango(),
      bibitpisang: lenguajeGB.eSPlatano(),

      ayam: '🐓 Pollo : Chicken',
      babi: '🐖 Puerco : Pig',
      Jabali: '🐗 Jabalí : Wild Boar',
      bull: '🐃 Toro : Bull',
      buaya: '🐊 Cocodrilo : Alligator',
      cat: lenguajeGB.eGato(),
      centaur: lenguajeGB.eCentauro(),
      chicken: '🐓 Pollo : Chicken',
      cow: '🐄 Vaca : Cow',
      dog: lenguajeGB.ePerro(),
      dragon: lenguajeGB.eDragon(),
      elephant: '🐘 Elefante : Elephant',
      fox: lenguajeGB.eZorro(),
      giraffe: '🦒 Jirafa : Giraffe',
      griffin: lenguajeGB.eAve(), //Mascota : Griffin',
      horse: lenguajeGB.eCaballo(),
      kambing: '🐐 Cabra : Goat',
      kerbau: '🐃 Búfalo : Buffalo',
      lion: '🦁 León : Lion',
      money: lenguajeGB.eMashCoins(),
      monyet: '🐒 Mono : Monkey',
      panda: '🐼 Panda',
      snake: '🐍 Serpiente : Snake',
      phonix: '🕊️ Fénix : Phoenix',
      rhinoceros: '🦏 Rinoceronte : Rhinoceros',
      wolf: lenguajeGB.eLobo(),
      tiger: '🐅 Tigre : Tiger',
      cumi: '🦑 Calamar : Squid',
      udang: '🦐 Camarón : Shrimp',
      ikan: '🐟 Pez : Fish',

      fideos: '🍝 Fideos : Noodles',
      ramuan: '🧪 Ingrediente NOVA : Ingredients',
      knife: '🔪 Cuchillo : Knife'
    }
    let results = Object.keys(emot)
      .map((v) => [v, new RegExp(v, 'gi')])
      .filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emot[results[0][0]]
  }
}

global.rpgg = {
  //Solo emojis
  emoticon(string) {
    string = string.toLowerCase()
    let emott = {
      level: '🧬',
      limit: '💎',
      exp: '⚡',
      bank: '🏦',
      diamond: '💎+',
      health: '❤️',
      kyubi: '🌀',
      joincount: '🪙',
      emerald: '💚',
      stamina: '✨',
      role: '💪',
      premium: '🎟️',
      pointxp: '📧',
      gold: '👑',

      trash: '🗑',
      crystal: '🔮',
      intelligence: '🧠',
      string: '🕸️',
      keygold: '🔑',
      keyiron: '🗝️',
      emas: '🪅',
      fishingrod: '🎣',
      gems: '🍀',
      magicwand: '⚕️',
      mana: '🪄',
      agility: '🤸‍♂️',
      darkcrystal: '♠️',
      iron: '⛓️',
      rock: '🪨',
      potion: '🥤',
      superior: '💼',
      robo: '🚔',
      upgrader: '🧰',
      wood: '🪵',

      strength: '🦹‍ ♀️',
      arc: '🏹',
      armor: '🥼',
      bow: '🏹',
      pickaxe: '⛏️',
      sword: '⚔️',

      common: '📦',
      uncoommon: '🥡',
      mythic: '🗳️',
      legendary: '🎁',
      petFood: '🍖',
      pet: '🍱',

      bibitanggur: '🍇',
      bibitapel: '🍎',
      bibitjeruk: '🍊',
      bibitmangga: '🥭',
      bibitpisang: '🍌',

      ayam: '🐓',
      babi: '🐖',
      Jabali: '🐗',
      bull: '🐃',
      buaya: '🐊',
      cat: '🐈',
      centaur: '🐐',
      chicken: '🐓',
      cow: '🐄',
      dog: '🐕',
      dragon: '🐉',
      elephant: '🐘',
      fox: '🦊',
      giraffe: '🦒',
      griffin: '🦅', //Mascota : Griffin',
      horse: '🐎',
      kambing: '🐐',
      kerbau: '🐃',
      lion: '🦁',
      money: '🐱',
      monyet: '🐒',
      panda: '🐼',
      snake: '🐍',
      phonix: '🕊️',
      rhinoceros: '🦏',
      wolf: '🐺',
      tiger: '🐅',
      cumi: '🦑',
      udang: '🦐',
      ikan: '🐟',

      fideos: '🍝',
      ramuan: '🧪',
      knife: '🔪'
    }
    let results = Object.keys(emott)
      .map((v) => [v, new RegExp(v, 'gi')])
      .filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emott[results[0][0]]
  }
}
global.rpgshop = {
  //Tienda
  emoticon(string) {
    string = string.toLowerCase()
    let emottt = {
      exp: lenguajeGB.eExp(),
      limit: lenguajeGB.eDiamante(),
      diamond: lenguajeGB.eDiamantePlus(),
      joincount: lenguajeGB.eToken(),
      emerald: lenguajeGB.eEsmeralda(),
      berlian: lenguajeGB.eJoya(),
      kyubi: lenguajeGB.eMagia(),
      gold: lenguajeGB.eOro(),
      money: lenguajeGB.eMashCoins(),
      tiketcoin: lenguajeGB.eMashTickers(),
      stamina: lenguajeGB.eEnergia(),
      potion: lenguajeGB.ePocion(),
      aqua: lenguajeGB.eAgua(),
      trash: lenguajeGB.eBasura(),
      wood: lenguajeGB.eMadera(),
      rock: lenguajeGB.eRoca(),
      batu: lenguajeGB.ePiedra(),
      string: lenguajeGB.eCuerda(),
      iron: lenguajeGB.eHierro(),
      coal: lenguajeGB.eCarbon(),
      botol: lenguajeGB.eBotella(),
      kaleng: lenguajeGB.eLata(),
      kardus: lenguajeGB.eCarton(),
      eleksirb: lenguajeGB.eEletric(),
      emasbatang: lenguajeGB.eBarraOro(),
      emasbiasa: lenguajeGB.eOroComun(),
      rubah: lenguajeGB.eZorroG(),
      sampah: lenguajeGB.eBasuraG(),
      serigala: lenguajeGB.eLoboG(),
      kayu: lenguajeGB.eMaderaG(),
      sword: lenguajeGB.eEspada(),
      umpan: lenguajeGB.eCarnada(),
      healtmonster: lenguajeGB.eBillete(),
      emas: lenguajeGB.ePinata(),
      pancingan: lenguajeGB.eGancho(),
      pancing: lenguajeGB.eCanaPescar(),

      common: lenguajeGB.eCComun(),
      uncoommon: lenguajeGB.ePComun(),
      mythic: lenguajeGB.eCMistica(),
      pet: lenguajeGB.eCMascota(), //?
      gardenboxs: lenguajeGB.eCJardineria(), //?
      legendary: lenguajeGB.eClegendaria(),

      anggur: lenguajeGB.eUva(),
      apel: lenguajeGB.eManzana(),
      jeruk: lenguajeGB.eNaranja(),
      mangga: lenguajeGB.eMango(),
      pisang: lenguajeGB.ePlatano(),

      bibitanggur: lenguajeGB.eSUva(),
      bibitapel: lenguajeGB.eSManzana(),
      bibitjeruk: lenguajeGB.eSNaranja(),
      bibitmangga: lenguajeGB.eSMango(),
      bibitpisang: lenguajeGB.eSPlatano(),

      centaur: lenguajeGB.eCentauro(),
      griffin: lenguajeGB.eAve(),
      kucing: lenguajeGB.eGato(),
      naga: lenguajeGB.eDragon(),
      fox: lenguajeGB.eZorro(),
      kuda: lenguajeGB.eCaballo(),
      phonix: lenguajeGB.eFenix(),
      wolf: lenguajeGB.eLobo(),
      anjing: lenguajeGB.ePerro(),

      petFood: lenguajeGB.eAMascots(), //?
      makanancentaur: lenguajeGB.eCCentauro(),
      makanangriffin: lenguajeGB.eCAve(),
      makanankyubi: lenguajeGB.eCMagica(),
      makanannaga: lenguajeGB.eCDragon(),
      makananpet: lenguajeGB.eACaballo(),
      makananphonix: lenguajeGB.eCFenix()
    }
    let results = Object.keys(emottt)
      .map((v) => [v, new RegExp(v, 'gi')])
      .filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emottt[results[0][0]]
  }
}

global.rpgshopp = {
  //Tienda
  emoticon(string) {
    string = string.toLowerCase()
    let emotttt = {
      exp: '⚡',
      limit: '💎',
      diamond: '💎+',
      joincount: '🪙',
      emerald: '💚',
      berlian: '♦️',
      kyubi: '🌀',
      gold: '👑',
      money: '🐱',
      tiketcoin: '🎫',
      stamina: '✨',

      potion: '🥤',
      aqua: '💧',
      trash: '🗑',
      wood: '🪵',
      rock: '🪨',
      batu: '🥌',
      string: '🕸️',
      iron: '⛓️',
      coal: '⚱️',
      botol: '🍶',
      kaleng: '🥫',
      kardus: '🪧',

      eleksirb: '💡',
      emasbatang: '〽️',
      emasbiasa: '🧭',
      rubah: '🦊🌫️',
      sampah: '🗑🌫️',
      serigala: '🐺🌫️',
      kayu: '🛷',
      sword: '⚔️',
      umpan: '🪱',
      healtmonster: '💵',
      emas: '🪅',
      pancingan: '🪝',
      pancing: '🎣',

      common: '📦',
      uncoommon: '🥡',
      mythic: '🗳️',
      pet: '📫', //?
      gardenboxs: '💐', //?
      legendary: '🎁',

      anggur: '🍇',
      apel: '🍎',
      jeruk: '🍊',
      mangga: '🥭',
      pisang: '🍌',

      bibitanggur: '🌾🍇',
      bibitapel: '🌾🍎',
      bibitjeruk: '🌾🍊',
      bibitmangga: '🌾🥭',
      bibitpisang: '🌾🍌',

      centaur: '🐐',
      griffin: '🦅',
      kucing: '🐈',
      naga: '🐉',
      fox: '🦊',
      kuda: '🐎',
      phonix: '🕊️',
      wolf: '🐺',
      anjing: '🐶',

      petFood: '🍖', //?
      makanancentaur: '🐐🥩',
      makanangriffin: '🦅🥩',
      makanankyubi: '🌀🥩',
      makanannaga: '🐉🥩',
      makananpet: '🍱🥩',
      makananphonix: '🕊️🥩'
    }
    let results = Object.keys(emotttt)
      .map((v) => [v, new RegExp(v, 'gi')])
      .filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emotttt[results[0][0]]
  }
}
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

// IDs de canales
global.ch = {
  ch1: '120363424784024162@newsletter',
  ch2: '120363424784024162@newsletter'
}
// • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

global.yt = 'https://youtube.com/@Mashdios'
global.ig = 'https://www.instagram.com/Mash_dios'
global.md = 'https://github.com/MashNina-Li/MashBot-MD'
global.fb = 'https://www.facebook.com/groups/872989990425789'
global.tk = 'https://www.tiktok.com/@Mash_dios'
global.ths = 'https://www.threads.net/@Mash_dios'
global.paypal = 'https://paypal.me/OficialGD'
global.asistencia = 'https://wa.me/message/MEKOUFBEOG5ED1'
global.all = 'https://www.atom.bio/MashBot'
global.canal1 = 'https://whatsapp.com/channel/0029Va4QjH7DeON0ePwzjS1A'
global.canal2 = 'https://whatsapp.com/channel/0029Va6yY0iLY6d6XDmqA03g'
global.canal3 = 'https://whatsapp.com/channel/0029VaKn22pDJ6GwY61Ftn15'
global.canal4 = 'https://t.me/globalgb'

global.soporteGB = 'https://chat.whatsapp.com/GQ82mPnSYnm0XL2hLPk7FV'
global.grupo1 = 'https://chat.whatsapp.com/JRG6rVJJV40IxlI1wjQ0E9'
global.grupo2 = 'https://chat.whatsapp.com/B5s3ohjEGofH5YDD05jAV5'
global.grupo_collab1 = 'https://chat.whatsapp.com/IO5k0UOF7hOJHE1eH3Fcxh'
global.grupo_collab2 = 'https://chat.whatsapp.com/GFsgXW2VD4I4FEOSlEg9wp'
global.grupo_collab3 = 'https://chat.whatsapp.com/H1TEBeMtFVv3RcayD1WfGU'
global.grupo_collab4 = 'https://chat.whatsapp.com/LuD3YzdOjH16LUwPPCVmL6'

// ═══════════════════════════════════════════════════════════════════════
// ✅ RAGE additions — required by handler.js and settingsCache.js
// ═══════════════════════════════════════════════════════════════════════
const _dbData = () => global.db?.data

const _listeners = { settings: [], sudo: [], banned: [] }
const _notify = (k) => _listeners[k].forEach((fn) => { try { fn() } catch {} })

export function registerSettingsListener(fn) { _listeners.settings.push(fn) }
export function registerSudoListener(fn) { _listeners.sudo.push(fn) }
export function registerBannedListener(fn) { _listeners.banned.push(fn) }

// ───────────── Banned users ─────────────
export function getBannedUsers() {
  const users = _dbData()?.users || {}
  return Object.keys(users).filter((jid) => users[jid]?.banned)
}

export function banUser(jid, reason = '') {
  const data = _dbData()
  if (!data || !jid) return false

  data.users ||= {}
  data.users[jid] ||= {}
  data.users[jid].banned = true
  data.users[jid].Banneduser = true
  data.users[jid].BannedReason = reason
  _notify('banned')
  return true
}

// ───────────── LID mapping ─────────────
export function mapLidToPhone(lid, phone) {
  const data = _dbData()
  if (!data || !lid || !phone) return false

  data.lidMap ||= {}
  data.lidMap[String(lid).split('@')[0]] = String(phone).replace(/[^0-9]/g, '')
  return true
}

export function getPhoneFromLid(lid) {
  if (!lid) return null
  return _dbData()?.lidMap?.[String(lid).split('@')[0]] || null
}

// ───────────── Settings ─────────────
const _defaultSettings = {
  device: 'default', prefix: '.', mode: 'public', gcpresence: false,
  antitag: false, antidelete: true, antilink: 'off', chatbotpm: false,
  packname: global.packname, author: global.author, multiprefix: false,
  stealth: false, startmessage: true, autoview: false, autoai: false,
  toxicagent: false, warn_limit: 3, autobio: false, presence: 'off',
  autoread: false, autolike: false, anticall: false, antiviewonce: false
}

export async function getSettings() {
  const data = _dbData()
  if (!data) return { ..._defaultSettings }
  data.settings ||= {}
  return { ..._defaultSettings, ...data.settings }
}

export async function setSetting(key, value) {
  const data = _dbData()
  if (!data) return false
  data.settings ||= {}
  data.settings[key] = value
  _notify('settings')
  return true
}

// ───────────── Sudo ─────────────
export async function getSudoUsers() {
  return _dbData()?.sudo || []
}

export async function addSudo(jid) {
  const data = _dbData()
  if (!data || !jid) return false
  data.sudo ||= []
  if (!data.sudo.includes(jid)) data.sudo.push(jid)
  _notify('sudo')
  return true
}

export async function removeSudo(jid) {
  const data = _dbData()
  if (!data) return false
  data.sudo = (data.sudo || []).filter((j) => j !== jid)
  _notify('sudo')
  return true
}

// ───────────── Banned groups / allowed users ─────────────
export async function getBannedGroups() {
  const chats = _dbData()?.chats || {}
  return Object.keys(chats).filter((jid) => chats[jid]?.isBanned)
}

export async function getAllowedUsers() {
  return _dbData()?.allowed || []
}

// ───────────── Group settings / warns ─────────────
const _groupDefaults = {
  antilink: false, antilinkgc: false, antibadword: false, antibot: false,
  antiforeign: false, antispam: false, antisticker: false, antitag: false,
  antistatusmention: false, antigroupstatus: false, gcpresence: false,
  warn_limit: 3
}

export async function getGroupSettings(jid) {
  const data = _dbData()
  if (!data) return { ..._groupDefaults }
  data.groupSettings ||= {}
  return { ..._groupDefaults, ...(data.groupSettings[jid] || {}) }
}

export async function setGroupSetting(jid, key, value) {
  const data = _dbData()
  if (!data) return false
  data.groupSettings ||= {}
  data.groupSettings[jid] ||= {}
  data.groupSettings[jid][key] = value
  return true
}

export async function getWarnLimit(jid) {
  const gs = await getGroupSettings(jid)
  if (gs.warn_limit) return gs.warn_limit
  return (await getSettings()).warn_limit || 3
}

export async function addWarn(jid, user) {
  const data = _dbData()
  if (!data) return 0
  data.warns ||= {}
  data.warns[jid] ||= {}
  data.warns[jid][user] = (data.warns[jid][user] || 0) + 1
  return data.warns[jid][user]
}

export async function resetWarn(jid, user) {
  const data = _dbData()
  if (!data?.warns?.[jid]) return true
  delete data.warns[jid][user]
  return true
}

export async function getBadWords(jid) {
  const data = _dbData()
  return data?.badwords?.[jid] || data?.badwords?.global || []
}

export async function getKnownBots() {
  return _dbData()?.knownBots || []
}

export async function getTrustedLinks(jid) {
  const data = _dbData()
  return data?.trustedLinks?.[jid] || data?.trustedLinks?.global || []
}

// ───────────── Settings update ─────────────
export async function updateSetting(key, value) {
  return setSetting(key, value)
}

// ───────────── AI conversation history ─────────────
export async function getConversationHistory(jid) {
  return _dbData()?.conversations?.[jid] || []
}

export async function addConversationMessage(jid, role, content) {
  const data = _dbData()
  if (!data) return false
  data.conversations ||= {}
  data.conversations[jid] ||= []
  const msg = typeof role === 'object' ? role : { role, content }
  data.conversations[jid].push(msg)
  if (data.conversations[jid].length > 30) data.conversations[jid].shift()
  return true
}

export async function clearConversationHistory(jid) {
  const data = _dbData()
  if (data?.conversations) delete data.conversations[jid]
  return true
}

// ───────────── Message store ─────────────
export async function saveMessage(id, msg) {
  const data = _dbData()
  if (!data || !id) return false
  data.msgStore ||= {}
  data.msgStore[id] = { msg, time: Date.now() }
  return true
}

export async function getMessage(id) {
  return _dbData()?.msgStore?.[id]?.msg || null
}

export async function deleteMessage(id) {
  const data = _dbData()
  if (data?.msgStore) delete data.msgStore[id]
  return true
}

export async function cleanupOldMsgStore(maxAgeMs = 24 * 60 * 60 * 1000) {
  const store = _dbData()?.msgStore
  if (!store) return 0
  const limit = Date.now() - maxAgeMs
  let n = 0
  for (const id of Object.keys(store)) {
    if (store[id].time < limit) { delete store[id]; n++ }
  }
  return n
}

// ───────────── Mention store ─────────────
export async function getMentionEntry(key) {
  return _dbData()?.mentions?.[key] || null
}

export async function setMentionEntry(key, value) {
  const data = _dbData()
  if (!data) return false
  data.mentions ||= {}
  data.mentions[key] = value
  return true
}

export async function removeMentionEntry(key) {
  const data = _dbData()
  if (data?.mentions) delete data.mentions[key]
  return true
}

// ═══════════════════════════════════════════════════════════════════════
// Hot reload when this file changes
// ═══════════════════════════════════════════════════════════════════════
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
