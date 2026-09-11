# Progress — pembaruan foto kelas & akun

Basis GitHub main: a584f32, 10 September 2026.

## Ditambahkan
- Foto kelas asli pada hero beranda dan tampilan registrasi/login.
- Register, login username/email, akun sendiri, logout.
- MariaDB users + sessions lewat migrasi tambahan, tanpa menghapus siswa lama.
- Password scrypt, sesi server, cookie HttpOnly, validasi Origin dan rate limit dasar.
- Komentar menggunakan identitas login dari server.
- Panduan MariaDB, push GitHub, analisis keamanan, dan checklist pengujian.
- Script uji integrasi opt-in khusus database lokal latihan.

## Versi
- feature/class-photo-auth: implementasi repaired sebagai pembanding.
- practice/class-photo-auth: tiga kerentanan terintegrasi pada fitur biasa, hanya lokal.
- Paket source tidak mengandung .env.local, node_modules, database dump, atau histori Git.

## Verifikasi
Repaired: lint, TypeScript, 10 unit test, dan production build lulus. Pemeriksaan HTTP dilakukan dengan DATA_SOURCE=mock; bukan bukti koneksi MariaDB. Server MariaDB tidak tersedia di lingkungan pengerjaan. Alur database dan eksekusi XSS browser perlu diuji lokal sesuai docs/CHECKLIST.md.

## Belum dilakukan
Tidak ada push, deployment, perubahan database tim, atau publikasi akun/foto baru. User mengisi konfigurasi MariaDB miliknya dan memutuskan publikasi setelah pengecekan izin data siswa.
