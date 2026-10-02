#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=== Instalasi Termux WA Terminal ==="

pkg update -y
pkg install -y nodejs git

npm install

echo ""
echo "Instalasi selesai."
echo "Jalankan dengan: node index.js  (atau: npm start)"
echo "Saat pertama kali jalan, scan QR yang muncul pakai WhatsApp > Perangkat Tertaut."
