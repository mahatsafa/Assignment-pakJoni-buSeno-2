# Praktikum di website kelas — bukan halaman lab baru
Jalankan ZIP vulnerable / branch lokal `practice/class-photo-auth` menggunakan `npm run dev`. Buka http://127.0.0.1:3000. Repaired ada di ZIP terpisah / `feature/class-photo-auth`.

Versi rentan menolak request production dan host nonlokal. Koneksi MariaDB dibatasi loopback dengan DB_NAME berakhiran `_practice` atau `_test`. Ini pengaman praktikum, bukan alasan untuk memasang tunnel, reverse proxy, atau membagikannya ke internet.

Gunakan database lokal terpisah, akun database berizin minimum, dan email dummy berakhiran `.test`. Jangan memakai email/password akun sekolah, Gmail, atau database produksi. Password login tetap disimpan sebagai hash di kedua versi.

## Persiapan
1. Buat database latihan dan jalankan migrasi sesuai MARIADB_SETUP.md.
2. Isi .env.local milikmu, termasuk DATA_SOURCE=mariadb, DB_NAME=tkj3_practice, dan APP_ORIGIN=http://127.0.0.1:3000.
3. Jalankan npm ci, npm run db:check, npm run dev.
4. Di /register buat dua akun dummy dengan username/email berbeda dan password khusus latihan.
5. Login dengan salah satu akun. Buat akun lainnya melalui browser privat atau setelah logout.

## A. SQL Injection — kolom pencarian siswa
Lokasi: `lib/students.ts`. Input digabung menjadi SQL oleh `pool.query()`, bukan dikirim sebagai parameter. Baik /siswa?q=... maupun /api/search?q=... memakai fungsi yang sama.

Masukkan ke kolom Cari nama siswa:
```text
' OR 1=1 #
```
Hasil yang diharapkan pada vulnerable: semua siswa dapat muncul.

Untuk menunjukkan pengungkapan **email akun dummy milik kelompokmu sendiri**, masukkan:
```text
' UNION SELECT id,username,email,NULL FROM users #
```
Query daftar mempunyai empat kolom. UNION membuat username muncul sebagai nama pada card dan email dummy sebagai keahlian. Baris UNION hanyalah demonstrasi bocornya data, bukan profil siswa baru; tombol Lihat Profil tidak membuat halaman akun.

Pada repaired, seluruh payload diperlakukan sebagai nama literal; tidak boleh muncul baris email akun. Login itu sendiri memakai parameterized query dan verifikasi hash di kedua versi. Jadi latihan ini **bukan bypass password login** dan tidak menampilkan password asli. Jangan mencoba mengambil hash/kredensial nyata.

## B. Stored XSS — komentar pada profil siswa
Login, buka profil, kemudian kirim:
```html
<img src=x onerror="alert('XSS-lokal')">
```
Vulnerable menyimpan HTML mentah dan merendernya dengan dangerouslySetInnerHTML. Alert diharapkan muncul saat komentar dirender dan ketika halaman dimuat ulang. Komentar tersimpan di MariaDB, bukan hanya state browser.

Opsional, untuk melihat dampaknya pada informasi sesi dummy sendiri tanpa mengirim data ke luar:
```html
<img src=x onerror="fetch('/api/auth/me').then(r=>r.json()).then(d=>alert(d.account?.email||'belum login'))">
```
Payload hanya menampilkan email akun yang sedang login pada browser tersebut. Cookie HttpOnly tidak dapat dibaca langsung oleh JavaScript, tetapi XSS masih bisa meminta data same-origin dengan sesi pengguna. Ini alasan HttpOnly bukan perbaikan XSS.

Repaired menormalkan/membatasi komentar, menghapus karakter pembentuk tag untuk kebijakan plain-text, dan merender nilai React biasa. Output encoding React adalah perlindungan pada sink; penghapusan < dan > bukan sanitizer HTML umum. Bahkan komentar raw yang sudah ada di DB tidak dieksekusi pada renderer repaired.

Untuk menghentikan alert berulang, sebagai admin database **latihan** sembunyikan hanya komentar uji yang ID-nya kamu catat:
```sql
UPDATE student_comments SET is_visible = 0 WHERE id = ID_KOMENTAR_UJI;
```
Ganti placeholder dengan angka ID komentar sendiri. Tindakan ini menyembunyikan, tidak menghapus, komentar.

## C. Path Traversal — tombol Buka foto siswa
Buka foto normal dari profil. Lalu ubah parameter name:
```text
http://127.0.0.1:3000/api/files?name=../../../security-fixtures/demo-secret.txt
```
Vulnerable diharapkan menampilkan `DEMO{path_traversal_understood}`. Segmen ../ keluar dari folder foto menuju file dummy di luar public. File tersebut bukan rahasia asli.

Kerentanan nyata terjadi pada penggunaan path dari input; untuk membatasi risiko paket tugas ini, ada **pagar luar tambahan**: hanya folder foto dan file fixture dummy tepat tersebut yang boleh dibaca setelah realpath. .env.local, source, file OS, file pribadi, dan symlink ke luar selalu ditolak. Jadi demonstrasi ini tidak memberi akses bebas ke filesystem.

Repaired hanya menerima basename gambar dengan ekstensi yang diizinkan, membatasi direktori, lalu memeriksa realpath untuk menolak symlink keluar. Payload traversal mengembalikan 400, foto normal tetap 200.

## Bukti laporan
Catat hasil aktual masing-masing percobaan, penyebab, dampak, file kode, screenshot sendiri, dan hasil setelah perbaikan. Jangan menulis 'lulus' hanya berdasarkan dokumen ini. Lihat CHECKLIST.md dan scripts/smoke-db.mjs untuk uji HTTP + MariaDB. Runner HTTP tidak membuktikan eksekusi JavaScript browser.
