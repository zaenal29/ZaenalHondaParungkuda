# Zaenal Abidin Honda Parungkuda — Full-Stack Marketing & Dealership Website

Website resmi pemasaran sepeda motor Honda untuk **PT Selamat Lestari Mandiri — Cabang Parungkuda** (`Jl. Siliwangi Depan Stasiun No.18, Parungkuda, Kecamatan Parungkuda, Kabupaten Sukabumi, Jawa Barat`).

---

## 1. Cara Install

Pastikan **Node.js v20+** sudah terpasang di sistem Anda.

```bash
npm install
```

---

## 2. Cara Menjalankan Secara Lokal

Jalankan server full-stack (Express API + Vite React Frontend) di port `3000`:

```bash
npm run dev
```

Buka browser dan akses `http://localhost:3000`.

---

## 3. Cara Membuat Database

Aplikasi menggunakan arsitektur database terstruktur dengan 2 mode penyimpanan:

1. **Mode Otomatis (Zero-Config Persistence)**: Saat pertama kali dijalankan, server otomatis membuat dan mengisi database relasional di `database/data.json` lengkap dengan 7 model motor Honda, 16 varian, pilihan warna per tipe, spesifikasi teknis, tabel simulasi kredit, promo, artikel panduan, dan testimoni.
2. **Mode PostgreSQL Production (`database/schema.sql`)**: Untuk deployment menggunakan PostgreSQL / Supabase / Cloud SQL, jalankan skrip DDL berikut pada instance PostgreSQL Anda:

```bash
psql -U postgres -d honda_parungkuda -f database/schema.sql
```

Tabel yang dibuat meliputi: `users`, `site_settings`, `tenors`, `motor_models`, `motor_variants`, `motor_colors`, `motor_images`, `motor_specs`, `credit_simulations`, `promos`, `articles`, dan `testimonials`.

---

## 4. Cara Mengatur Environment Variables

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Konfigurasi variabel di dalam `.env`:

```env
ADMIN_USER="admin"
ADMIN_PASSWORD="hondaparungkuda2026"
JWT_SECRET="ganti-dengan-secret-key-acak-anda"
```

---

## 5. Cara Mengatur Authentication

- Sistem autentikasi menggunakan **Password Hashing (`crypto.scryptSync` + Salt)** dan **Signed JWT (`HMAC-SHA256`)** pada sisi server (`src/lib/auth.ts`).
- Password admin **tidak pernah** disimpan dalam bentuk teks biasa maupun diekspos ke kode frontend.
- Seluruh endpoint `/api/admin/*` dilindungi oleh middleware `requireAdmin` yang memverifikasi header `Authorization: Bearer <token>`.

---

## 6. Cara Mengatur Storage & Upload Foto

- Sistem menyediakan fitur upload gambar langsung dari Dashboard Admin (`POST /api/admin/upload`).
- Validasi otomatis memastikan hanya format **JPG, JPEG, PNG, dan WEBP** dengan ukuran maksimal **5 MB** yang diterima.
- Gambar yang diunggah disimpan secara terstruktur dan disajikan melalui endpoint `/api/uploads/:id`.

---

## 7. Cara Import Excel Data Kredit

1. Login ke **Dashboard Admin** -> buka menu **Import Excel**.
2. Klik tombol **"Download Template Excel"** untuk mengunduh file `Template_Kredit_Honda_Parungkuda.xlsx` atau akses langsung `/api/template-excel`.
3. Isi data kredit sesuai kolom yang tersedia, lalu klik area **Upload File Excel (.xlsx)**.
4. Sistem akan memvalidasi seluruh baris terlebih dahulu. Jika terdapat kesalahan penulisan angka atau kolom kosong, sistem menampilkan nomor baris yang bermasalah dan menolak memasukkan data yang rusak.

---

## 8. Format Excel Simulasi Kredit

Format kolom wajib pada baris pertama (Header):

| MODEL | TIPE | WARNA | DP | OTR | 11 | 17 | 23 | 29 | 35 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Beat | CBS | Biru | 2000000 | 19000000 | 1890000 | 1325000 | 1045000 | 895000 | 785000 |
| Beat | CBS | Biru | 3000000 | 19000000 | 1780000 | 1250000 | 985000 | 842000 | 739000 |
| Beat | CBS | Biru | 5000000 | 19000000 | 1560000 | 1095000 | 865000 | 740000 | 648000 |

- **DP**, **OTR**, dan kolom tenor (**11, 17, 23, 29, 35**, dst.) wajib diisi menggunakan **angka murni** tanpa titik/huruf `Rp`.
- Jika Admin menambahkan tenor baru (misal `47` bulan) di menu **Data Kredit**, kolom `47` otomatis didukung saat import Excel.

---

## 9. Cara Login Admin

1. Buka halaman utama website, gulir ke bagian paling bawah (**Footer**) atau buka menu navigasi mobile, lalu klik tombol **"Admin"**.
2. Masukkan kredensial default (atau sesuai `.env`):
   - **USER ID**: `admin`
   - **PASSWORD**: `hondaparungkuda2026`
3. Klik **"Masuk ke Dashboard"**.

---

## 10. Cara Deployment

1. Build aset frontend untuk production:
   ```bash
   npm run build
   ```
2. Jalankan server production:
   ```bash
   NODE_ENV=production npm start
   ```

---

## 11. Cara Mengganti Kredensial Admin

1. Masuk ke **Dashboard Admin** -> pilih menu **Pengaturan Website**.
2. Pada bagian **"Ubah Kredensial Login Admin (User ID & Password)"**, masukkan **User ID Baru** dan **Password Baru** (minimal 6 karakter).
3. Klik **"Perbarui User ID & Password"**. Perubahan langsung berlaku saat itu juga.

---

## 12. Cara Backup Database

1. Masuk ke **Dashboard Admin** -> buka menu **Import Excel**.
2. Klik tombol **"Export / Backup Data ke Excel"**.
3. Sistem akan mengunduh file `Backup_Katalog_Kredit_Honda_Parungkuda.xlsx` yang berisi seluruh tabel simulasi kredit dan katalog motor Anda, atau salin file `database/data.json` sebagai cadangan penuh.
