# Tutorial Mencari Celah Keamanan — Website XI TKJ 3 (Kelompok Faris & Gusto)

> **Peringatan:** panduan ini cuma buat dipakai di lingkungan lab tertutup (localhost / jaringan sekolah), bukan buat production atau sistem orang lain. Jangan dipake di internet publik.

Repo: https://github.com/mahatsafa/Assignment-pakJoni-buSeno-2

---

## 0. Login Akun Dummy

Sebelum coba-coba fitur yang butuh login, pakai akun dummy berikut:

- **Password:** `1234567890112233`
- Username/email dummy menyesuaikan yang sudah di-seed di database (cek `database/schema.sql` atau `database/migrations/` buat lihat akun contoh yang ada).

---

## 1. SQL Injection (SQLi)

**Lokasi:** fitur pencarian siswa (`/api/search` atau form pencarian di halaman daftar siswa).

**Payload:**
```
' OR '1'='1 -
```

**Cara coba:**
1. Buka halaman daftar siswa / pencarian siswa.
2. Ketik payload di atas ke kolom pencarian, lalu submit.
3. Kalau rentan, hasilnya bakal nampilin **semua** data siswa, padahal harusnya nggak ada siswa yang namanya persis kayak payload itu.

**Kenapa ini bisa kejadian:**
Payload ini nyisipin kondisi `OR '1'='1'` ke klausa `WHERE` di query SQL. Karena `1'='1'` selalu `true`, seluruh baris di tabel jadi ke-include di hasil query — filter pencarian jadi nggak berfungsi. Ini kejadian kalau backend nyambungin input pengguna langsung ke string query SQL tanpa parameterized query / prepared statement.

**Dampak:** bisa dipake buat bypass filter, ambil semua data, atau (kalau lebih parah, pake UNION SELECT) narik data dari tabel lain kayak tabel user/admin.

---

## 2. Cross-Site Scripting (XSS)

**Lokasi:** kolom komentar / deskripsi profil siswa.

**Payload:**
```html
<img src=x onerror=confirm("ini milik kelompok faris dan gusto")>
```

**Cara coba:**
1. Buka halaman profil siswa yang ada kolom komentar.
2. Isi kolom komentar/nama dengan payload di atas, lalu kirim.
3. Kalau rentan, bakal muncul popup dialog konfirmasi bertuliskan "ini milik kelompok faris dan gusto" — baik langsung waktu submit atau tiap kali halaman itu dibuka ulang.

**Kenapa ini bisa kejadian:**
Atribut `onerror` di tag `<img>` bakal jalan kalau sumber gambarnya (`src=x`) gagal dimuat — dan karena `x` bukan URL gambar valid, ini selalu gagal, jadi skrip di dalam `onerror` selalu dieksekusi. Ini kejadian kalau input yang disimpan ditampilkan lagi ke halaman tanpa di-escape / disanitasi dulu (biasanya lewat `dangerouslySetInnerHTML` atau render HTML mentah).

Karena payload-nya kesimpen di server dan ke-trigger tiap kali komentar itu ditampilkan (bukan cuma pas dikirim), ini termasuk **Stored XSS** — lebih bahaya dari reflected XSS karena bisa kena ke semua orang yang buka halaman itu, tanpa perlu kirim link khusus.

**Dampak:** pencurian sesi/cookie, defacement halaman, phishing, sampai account takeover kalau dikombinasi teknik lain.

---

## 3. Path Traversal

**Lokasi:** endpoint pengambilan file (`/api/files`).

**Payload (URL lengkap):**
```
http://sesuaikan dengan ip:3001/api/files?name=../../../security-fixtures/demo-secret.txt
```

**Cara coba:**
1. Buka URL di atas langsung di browser, atau pakai `curl`:
   ```bash
   curl "http://sesuaikan dengan ip:3001/api/files?name=../../../security-fixtures/demo-secret.txt"
   ```
2. Kalau rentan, isi file `demo-secret.txt` bakal ditampilkan, padahal file itu ada di luar folder yang harusnya diakses lewat endpoint ini.

**Kenapa ini bisa kejadian:**
Parameter `name` digabung langsung ke path direktori tempat nyimpen file (misal pakai `path.join()`), tanpa validasi atau pembatasan. Sekuens `../` yang disisipin bikin referensi path "mundur" keluar dari folder yang seharusnya, sampai akhirnya nyampe ke folder `security-fixtures` yang isinya file yang nggak seharusnya bisa diakses publik.

**Dampak:** kebocoran file sensitif — bisa jadi source code, file konfigurasi (`.env`), sampai file sistem kalau traversal-nya cukup dalam.

---

## Ringkasan

| Jenis | Lokasi | Payload |
|---|---|---|
| SQL Injection | Fitur pencarian siswa | `' OR '1'='1 -` |
| XSS (Stored) | Kolom komentar profil | `<img src=x onerror=confirm("ini milik kelompok faris dan gusto")>` |
| Path Traversal | `/api/files?name=` | `../../../security-fixtures/demo-secret.txt` |

Ketiga kerentanan ini memang **sengaja ditanamkan** di branch `vulnerable` sebagai bahan praktikum keamanan web (sesuai `docs/VULNERABLE_VERSION.md`), jadi bukan bug yang perlu buru-buru diperbaiki — tapi tetap jangan dipake di luar lingkungan lab tertutup.
