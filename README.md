# TikTok History Viewer

Website statis untuk melihat **watch history** dan **search history** TikTok dari file export `.txt` atau `.json`.

## Fitur

- Upload banyak file `.txt` atau `.json` sekaligus.
- Parsing format TikTok `Video Browsing History` dan `Search History`, plus fallback untuk struktur JSON/TXT yang mirip.
- Filter tab Semua, Watch, dan Search.
- Pencarian cepat berdasarkan keyword, URL, atau tanggal.
- Sorting terbaru, terlama, atau kelompok tipe.
- Pop-up preview link dengan iframe dan tombol fallback untuk membuka tab baru.
- Export hasil filter ke CSV.
- Semua pemrosesan dilakukan lokal di browser, data tidak dikirim ke server.

## Menjalankan lokal

```bash
npm install --ignore-scripts
npm run dev
```

Lalu buka `http://localhost:5173`.

## Build untuk Vercel atau Railway

```bash
npm run build
```

Konfigurasi `vercel.json` sudah mengatur:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `installCommand`: `npm install --ignore-scripts --no-audit --no-fund`

Jadi project bisa langsung di-import ke Vercel dan dideploy sebagai static site. File CSS dimuat lewat tag `<link>` agar hasil build statis tetap berjalan tanpa bundler.

## Deploy ke Railway

Project ini juga bisa jalan di Railway. Konfigurasi `railway.json` sudah mengatur Nixpacks untuk menjalankan `npm run build`, lalu start command `npm start` akan menjalankan server statis Node kecil untuk menyajikan folder `dist` memakai port dari environment variable `PORT` Railway.

Langkah singkat:

1. Push repository ke GitHub.
2. Buat project baru di Railway dari repository ini.
3. Railway akan membaca `railway.json`, menjalankan build, lalu menjalankan static server otomatis.
4. Buka domain Railway yang diberikan dan upload file TikTok seperti biasa.
