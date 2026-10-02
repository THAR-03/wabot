# Termux WA Terminal

Klien WhatsApp berbasis terminal untuk Termux. Membalas chat **pribadi** langsung
dari terminal tanpa membuka aplikasi WhatsApp. Chat grup otomatis diabaikan.

⚠️ **Catatan penting**: ini menggunakan koneksi tidak resmi ke WhatsApp Web
(library Baileys), bukan API resmi WhatsApp Business. Untuk pemakaian pribadi
wajar (baca & balas chat biasa) risikonya kecil, tapi pemakaian berlebihan atau
otomatis mengirim banyak pesan bisa membuat akun dibatasi oleh WhatsApp. Gunakan
dengan wajar dan atas tanggung jawab sendiri.

## 1. Upload ke GitHub kamu sendiri

```bash
cd termux-wa-terminal
git init
git add .
git commit -m "init: termux wa terminal"
git branch -M main
git remote add origin https://github.com/USERNAME/termux-wa-terminal.git
git push -u origin main
```

Folder `auth_info/` (berisi sesi login WhatsApp kamu) sengaja tidak ikut
ter-upload — jangan pernah membagikan folder itu ke siapa pun, karena berisi
kunci sesi yang setara dengan akses ke akun WhatsApp kamu.

## 2. Instal di Termux

```bash
pkg install -y git
git clone https://github.com/USERNAME/termux-wa-terminal.git
cd termux-wa-terminal
bash install.sh
```

## 3. Jalankan & login

```bash
node index.js
```

Saat pertama kali jalan, akan muncul **QR code** di terminal. Scan dengan HP:

1. Buka WhatsApp di HP
2. Pengaturan → Perangkat Tertaut → Tautkan Perangkat
3. Scan QR yang muncul di Termux

Setelah tersambung, sesi disimpan di folder `auth_info/` — lain kali jalan
`node index.js` tidak perlu scan ulang (selama tidak logout).

## Tampilan & cara pakai

Menu utama menampilkan daftar kontak yang mengirim pesan pribadi:

```
➥Budi(1000)
➥Siti(1001)
➥Andi(1002)

Ketik ID untuk buka chat, atau /exit untuk keluar.
menu>
```

- Ketik ID (misal `1000`) → masuk ke halaman chat dengan kontak itu
- Di dalam chat, ketik teks biasa → langsung terkirim sebagai balasan WhatsApp
- Ketik `/back` → kembali ke menu utama
- Ketik `/exit` → keluar dari program (dari menu atau dari chat)

## Batasan versi ini

- Hanya menampilkan pesan yang masuk **setelah** program dijalankan (riwayat
  chat lama sebelum program dibuka tidak dimuat)
- ID kontak di-generate otomatis urut (1000, 1001, dst) dan **reset tiap kali
  program dijalankan ulang** — bukan ID tetap per kontak
- Pesan media (gambar, video, dll) hanya ditampilkan sebagai `[media/non-teks]`
  atau caption-nya saja, belum bisa ditampilkan isinya
