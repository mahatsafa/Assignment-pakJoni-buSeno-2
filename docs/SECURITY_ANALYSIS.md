# Analisis tiga celah dan perbaikannya
Website yang dibandingkan sama: beranda, siswa, akun, komentar, dan pembuka foto. Tidak ada dashboard lab tambahan.

| Fitur / lokasi | Penyebab pada vulnerable | Dampak yang didemonstrasikan | Perbaikan pada repaired |
| --- | --- | --- | --- |
| Pencarian / lib/students.ts | Input disisipkan langsung ke string SQL | UNION dapat mengungkap username/email akun dummy | execute dengan placeholder ?, input dibatasi, wildcard LIKE di-escape |
| Komentar / API comments + CommentSection.tsx | HTML mentah tersimpan lalu masuk dangerouslySetInnerHTML | Script berjalan saat profil dilihat; bisa membaca data akun same-origin | Validasi + sanitasi plain-text dan output encoding React, tanpa sink HTML mentah |
| Buka foto / API files | Nama/path dari pengguna dipakai untuk mengakses file | File fixture di luar direktori foto terbaca | Allowlist basename/ekstensi, pemeriksaan batas path, realpath untuk symlink |

## SQL Injection
Pemisahan kode SQL dari data input adalah inti perbaikan; validasi panjang saja tidak cukup. Endpoint autentikasi tetap menggunakan prepared statement dan pemeriksaan hash di kedua versi. Latihan pengungkapan email dilakukan lewat pencarian, bukan menambahkan endpoint yang sengaja mengembalikan daftar email. Query raw benar-benar dikirim ke MariaDB; mock tidak mensimulasikan serangan.

Dampak di sistem tanpa pembatasan dapat lebih luas bergantung hak DB. Dalam tugas ini akun DB harus hanya punya SELECT/INSERT/UPDATE/DELETE pada database dummy. Jangan beri hak FILE atau hak pada database lain. Referensi: [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## Stored XSS
Registrasi/login tidak memperbaiki XSS: pengguna terdaftar masih dapat menyimpan konten berbahaya. Pada repaired kebijakan komentar adalah teks biasa, bukan rich text. Sanitasi sederhana di lib/validation.ts tidak boleh dipakai untuk mengizinkan HTML; jika nanti membutuhkan rich text gunakan sanitizer HTML yang sesuai. Output harus di-encode sesuai konteks. Referensi: [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

HttpOnly membantu melindungi cookie dari pembacaan JavaScript, tetapi script same-origin masih bisa melakukan request sebagai sesi pengguna. Contoh latihan hanya alert lokal dan pembacaan email dummy sendiri, tanpa pengiriman data ke layanan luar.

## Path Traversal
path.resolve saja tidak mengamankan input; fungsi tersebut dapat menghasilkan lokasi di luar folder dasar. Repaired memeriksa nama, ekstensi, lokasi relatif dan path nyata. Direktori foto harus dikelola server dan tidak writable oleh pengguna website. Pagar luar pada vulnerable sengaja membatasi pembacaan tambahan ke satu fixture dummy, tetapi tetap memperlihatkan pelanggaran batas folder foto.

## Akun dan sesi
- Username/email unik; form register tidak membuat profil siswa baru.
- Password: scrypt dengan salt acak per akun, tidak disimpan/dikembalikan sebagai plaintext. Parameter N=32768, r=8, p=3 sesuai salah satu konfigurasi rekomendasi [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Cookie token acak 32 byte; database hanya menyimpan SHA-256 token. Cookie HttpOnly, SameSite=Lax, Secure pada HTTPS.
- Sesi 8 jam, diverifikasi server, dirotasi saat login dan dicabut saat logout.
- Request mutasi diperiksa Origin, JSON dibatasi 4 KB, respons tidak menampilkan hash password.
- Rate limiter per proses untuk percobaan login/registrasi/komentar; bukan solusi multi-instance.
- Email belum diverifikasi; tidak ada password reset, role admin, atau moderasi UI. Jangan menganggap login ini identitas resmi siswa.

## Verifikasi
Ulangi input pada VULNERABLE_VERSION.md terhadap masing-masing versi dengan database terpisah. Buktikan kondisi sebelum/sesudah, bukan sekadar menunjukkan potongan kode. Gunakan CHECKLIST.md untuk memisahkan test unit, HTTP/database, dan browser. Tidak ada klaim bahwa paket ini telah diaudit penuh untuk produksi.
