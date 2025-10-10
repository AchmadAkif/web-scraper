## Instalasi
### 1️⃣ Kloning Repositori (Opsional) / Download ZIP

Jika kode ini ada di repositori Git, kloning terlebih dahulu. Atau download langsung ZIP.

```bash
git clone <url-repositori-anda>
cd <nama-folder-proyek>
```

---

### 2️⃣ Instal Dependensi Proyek

Instal seluruh dependensi proyek.

```bash
npm install
```

## Penggunaan
### 1️⃣ Atur Parameter Scraping

Buka file `index.ts` dan ubah parameter tahun dan bulan di baris paling bawah sesuai kebutuhan Anda.

```typescript
// Ganti tahun (2024) dan bulan (5) sesuai kebutuhan
scrapeData(2024, 5); 
```

---

### 2️⃣ Jalankan Skrip

Kembali ke terminal Anda dan jalankan perintah berikut:

```bash
npm start
```

Skrip akan mulai berjalan, dan Anda akan melihat log prosesnya di terminal.

---

## 📄 Output

Setelah skrip selesai, Anda akan menemukan dua file baru di folder proyek Anda dengan format nama:

```
scraped_data_[year]_[month]
```

Contoh:

- `scraped_data_2024_5.json` → Berisi data lengkap dalam format **JSON**, dengan konten berita dalam bentuk array.  
- `scraped_data_2024_5.csv` → Berisi data dalam format **tabel (CSV)**, dengan konten berita yang sudah digabung menjadi satu teks agar mudah dibaca di spreadsheet.

---
