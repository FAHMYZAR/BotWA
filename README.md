# FAHMYZZX-BotWa - WhatsApp User Bot 🤖

FAHMYZZX-BotWa adalah sebuah **user bot** untuk WhatsApp yang dirancang untuk membantu mengelola akun WhatsApp Anda secara otomatis. Dengan fitur-fitur canggih seperti downloader, pencarian, pembuatan stiker, dan berbagai alat lainnya, FAHMYZZX-BotWa memberikan pengalaman yang lebih efisien dan menyenangkan dalam menggunakan WhatsApp.

---

## ✨ Fitur Utama

### 📥 Downloader
Unduh media dari berbagai platform populer:
- **TikTok** (tanpa watermark)
- **Instagram** (post, reels, story)
- **YouTube** (audio/video)
- **Facebook**
- **Twitter**
- **Spotify**
- **MediaFire**
- **CapCut**
- **SoundCloud**
- Dan banyak lagi!

### 🎭 Stiker
- Buat stiker dari gambar atau teks.
- Tambahkan efek "triggered" pada gambar.
- Cari stiker berdasarkan kata kunci.

### 🔎 Pencarian
Cari informasi dari berbagai platform:
- **YouTube**
- **Pinterest**
- **Play Store**
- **Cuaca**
- **Gempa**
- **WhatsApp Group**
- Dan lainnya!

### 🛠️ Tools
- **OCR**: Ekstrak teks dari gambar.
- **Remove Background**: Hapus latar belakang gambar.
- **Shortlink**: Perpendek URL.
- **Screenshot Website**: Ambil tangkapan layar dari sebuah situs web.
- **Text to QR Code**: Buat QR code dari teks.
- **Image Upscale (Remini)**: Tingkatkan kualitas gambar.

### 🎨 Maker
- Buat gambar kreatif seperti teks bergaya, emoji mix, dan lainnya.

### 🌐 Internet Tools
- **Whois**: Cari informasi domain.
- **IP Info**: Dapatkan informasi tentang alamat IP.
- **Temporary Email**: Buat email sementara.

### 🧠 Keynote
- Simpan dan akses catatan dengan mudah menggunakan perintah.

---

## 🚀 Cara Menggunakan

### 1. Instalasi
1. Pastikan Anda memiliki **Node.js** versi terbaru.
2. Clone repository ini:
   ```bash
   git clone https://github.com/FAHMYZAR/FAHMYZZX-BotWa.git
   cd FAHMYZZX-BotWa
   ```
3. Instal dependensi:
   ```bash
   npm install
   ```

### 2. Konfigurasi
- Pastikan Anda sudah login ke WhatsApp menggunakan **whatsapp-web.js**.
- Jalankan bot:
   ```bash
   npm start
   ```

### 3. Perintah
Gunakan prefix berikut untuk menjalankan perintah:
- **Owner Prefix**: `!`
- **User Prefix**: `.`

#### Contoh Perintah:
- **Download Video TikTok**:
  ```
  !download tiktok https://www.tiktok.com/@username/video/1234567890
  ```
- **Cari Video YouTube**:
  ```
  .search youtube Coldplay
  ```
- **Buat Stiker**:
  - Kirim gambar dan balas dengan:
    ```
    .sticker
    ```
- **Hapus Latar Belakang Gambar**:
  ```
  .tools removebg [URL gambar]
  ```

---

## 🛡️ Keamanan
- Folder berikut diabaikan dari repository untuk menjaga keamanan dan mengurangi ukuran:
  - `wawebjs_auth/`: Data autentikasi WhatsApp.
  - `wawebjs_cache/`: Cache versi web WhatsApp.
  - `node_modules/`: Dependensi proyek.

---

## 📚 Teknologi yang Digunakan
- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)**: Library untuk mengotomatisasi WhatsApp.
- **Node.js**: Runtime JavaScript.
- **Axios**: HTTP client untuk API.
- **FFmpeg**: Untuk konversi video.
- **Sharp**: Untuk manipulasi gambar.
- **Canvas**: Untuk pembuatan gambar kreatif.

---

## 🛠️ Pengembangan
Jika Anda ingin berkontribusi:
1. Fork repository ini.
2. Buat branch baru:
   ```bash
   git checkout -b fitur-baru
   ```
3. Lakukan perubahan dan commit:
   ```bash
   git commit -m "Menambahkan fitur baru"
   ```
4. Push ke branch Anda:
   ```bash
   git push origin fitur-baru
   ```
5. Buat Pull Request.

---

## 🐞 Pelaporan Bug
Jika Anda menemukan bug, silakan laporkan di [Issues](https://github.com/FAHMYZAR/FAHMYZZX-BotWa/issues).

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah lisensi **ISC**.

---

## 💡 Tentang Pengembang
Bot ini dikembangkan oleh **FahmyzzxXJongnesia**. Jika Anda memiliki pertanyaan atau ingin berdiskusi, jangan ragu untuk menghubungi saya melalui [GitHub](https://github.com/FAHMYZAR).

---

Terima kasih telah menggunakan **FAHMYZZX-BotWa**! 🎉