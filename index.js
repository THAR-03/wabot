/**
 * Termux WA Terminal
 * Klien WhatsApp berbasis terminal: hanya menampilkan & membalas chat PRIBADI
 * (chat grup diabaikan). Login lewat scan QR (seperti WhatsApp Web).
 *
 * Perintah di layar menu utama:
 *   <ID 4 digit>  -> buka chat dengan kontak itu
 *   /exit         -> keluar program
 *
 * Perintah di dalam chat:
 *   /back  -> kembali ke menu utama
 *   /exit  -> keluar program
 *   (teks apa pun selain itu akan dikirim sebagai balasan WhatsApp)
 */

const makeWASocket = require('@whiskeysockets/baileys').default
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const readline = require('readline')

let sock
let contacts = {}        // shortId -> { jid, name }
let jidToShortId = {}    // jid -> shortId
let messagesByJid = {}   // jid -> [{ from, text }]
let nextId = 1000
let mode = 'menu'        // 'menu' | 'chat'
let currentJid = null

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function genShortId() {
  const id = String(nextId)
  nextId++
  if (nextId > 9999) nextId = 1000
  return id
}

function isGroup(jid) {
  return typeof jid === 'string' && jid.endsWith('@g.us')
}

function getOrCreateContact(jid, name) {
  if (jidToShortId[jid]) return jidToShortId[jid]
  const id = genShortId()
  contacts[id] = { jid, name: name || jid.split('@')[0] }
  jidToShortId[jid] = id
  messagesByJid[jid] = []
  return id
}

function extractText(msg) {
  const m = msg.message || {}
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    '[media/non-teks]'
  )
}

function printMenu() {
  console.clear()
  console.log('=== Termux WA Terminal ===\n')
  const ids = Object.keys(contacts)
  if (ids.length === 0) {
    console.log('(belum ada pesan pribadi masuk)')
  } else {
    ids.forEach((id) => {
      console.log(`➥${contacts[id].name}(${id})`)
    })
  }
  console.log('\nKetik ID untuk buka chat, atau /exit untuk keluar.')
  rl.setPrompt('menu> ')
  rl.prompt()
}

function printChat(jid) {
  console.clear()
  const id = jidToShortId[jid]
  console.log(`=== Chat dengan ${contacts[id].name} ===`)
  console.log('(/back untuk kembali ke menu utama, /exit untuk keluar)\n')
  const msgs = messagesByJid[jid] || []
  msgs.forEach((m) => console.log(`${m.from}: ${m.text}`))
  console.log('')
  rl.setPrompt('chat> ')
  rl.prompt()
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  sock = makeWASocket({ auth: state, printQRInTerminal: false })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\nScan QR ini dengan WhatsApp: Pengaturan > Perangkat Tertaut > Tautkan Perangkat\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('\nKoneksi terputus.', shouldReconnect ? 'Menyambung ulang...' : 'Logout — hapus folder auth_info lalu scan ulang.')
      if (shouldReconnect) start()
    } else if (connection === 'open') {
      console.log('\nTersambung ke WhatsApp!\n')
      printMenu()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue
      const jid = msg.key.remoteJid
      if (!jid || isGroup(jid) || jid === 'status@broadcast') continue
      if (msg.key.fromMe) continue // balasan sendiri tidak perlu dicatat ulang di sini

      const name = msg.pushName || jid.split('@')[0]
      const id = getOrCreateContact(jid, name)
      const text = extractText(msg)
      messagesByJid[jid].push({ from: name, text })

      if (mode === 'chat' && currentJid === jid) {
        console.log(`${name}: ${text}`)
        rl.prompt()
      } else if (mode === 'menu') {
        printMenu()
      } else {
        console.log(`\n[pesan baru dari ${name}(${id})]`)
        rl.prompt()
      }
    }
  })
}

rl.on('line', async (line) => {
  const input = line.trim()

  if (mode === 'menu') {
    if (input === '/exit') {
      process.exit(0)
    } else if (contacts[input]) {
      currentJid = contacts[input].jid
      mode = 'chat'
      printChat(currentJid)
    } else if (input.length > 0) {
      console.log('ID tidak ditemukan.')
      rl.prompt()
    } else {
      rl.prompt()
    }
    return
  }

  if (mode === 'chat') {
    if (input === '/back') {
      mode = 'menu'
      currentJid = null
      printMenu()
    } else if (input === '/exit') {
      process.exit(0)
    } else if (input.length > 0) {
      try {
        await sock.sendMessage(currentJid, { text: input })
        messagesByJid[currentJid].push({ from: 'Saya', text: input })
        console.log(`Saya: ${input}`)
      } catch (e) {
        console.log('[gagal mengirim]', e.message)
      }
      rl.prompt()
    } else {
      rl.prompt()
    }
  }
})

start()
