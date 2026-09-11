# Checklist pengujian

## Sudah diperiksa saat pengerjaan
- Versi repaired: lint, TypeScript, 10 unit test, dan production build lulus.
- Uji HTTP repaired pada mock: beranda/login/register/daftar/profil/foto 200, /api/auth/me 401 tanpa sesi, traversal dan .env.local 400, mutasi tanpa Origin 403, autentikasi mock 503 eksplisit.
- Versi vulnerable: lint, TypeScript, 14 unit test, dan build lulus. Build hanya memeriksa kompilasi; request production ditolak (503).
- Uji HTTP vulnerable pada mock: beranda, login/register, daftar/profil, foto kelas/foto siswa berhasil; /api/auth/me tanpa sesi 401; fixture traversal 200; .env.local 400; Origin asing 403; Host/forwarded Host publik 503.
- Foto kelas disalin dari PNG yang diberikan, tanpa pengeditan; dimensi 1600 × 900.
- Tidak ada koneksi ke MariaDB milik tim, push GitHub, atau deployment.

Unit test bukan bukti integrasi database. Lingkungan pengerjaan tidak memiliki server MariaDB. Uji berikut perlu dijalankan di perangkatmu; jangan menandainya selesai sebelum mencobanya.

## MariaDB dan akun
- [ ] db:check menampilkan jumlah siswa/komentar/akun dan memastikan tabel sessions ada.
- [ ] Dua migrasi tidak mengubah jumlah siswa lama.
- [ ] Register username unik, email dummy, password 12–128 karakter.
- [ ] Username/email duplikat ditolak; JSON rusak ditolak; password salah tidak bisa login.
- [ ] Login berhasil dengan username dan dengan email.
- [ ] Akun masih bisa dipakai setelah restart Next.js (data bukan memori).
- [ ] /akun tanpa sesi diarahkan ke /login; /api/auth/me tanpa sesi mengembalikan 401.
- [ ] Cookie HttpOnly; logout membatalkan sesi di DB, bukan hanya menyembunyikan tombol.
- [ ] Ubah expires_at satu sesi dummy ke masa lalu; sesi itu tidak lagi bisa dipakai.
- [ ] Komentar anonim ditolak. Nama penulis selalu dari sesi, bukan field yang dikirim pengguna.

## Tiga celah
Ikuti [VULNERABLE_VERSION.md](VULNERABLE_VERSION.md) dan ulangi pada versi repaired.
- [ ] Search biasa menemukan siswa sesuai nama.
- [ ] SQLi UNION hanya menampilkan email dummy di versi vulnerable; repaired tidak.
- [ ] Komentar penanda XSS menjalankan alert di versi vulnerable, termasuk setelah reload.
- [ ] Komentar raw dari DB lama tetap tidak dieksekusi saat dirender oleh versi repaired.
- [ ] Foto valid bisa dibuka. Traversal fixture berhasil hanya pada versi vulnerable.
- [ ] Akses .env.local dan file pribadi selalu ditolak, termasuk versi vulnerable.

## Uji integrasi otomatis opsional
Gunakan DB lokal disposable dengan nama berakhiran _practice atau _test, tabel sudah dimigrasi, dan server dev sedang berjalan. Script membuat satu akun/siswa dummy dan membersihkan hanya row buatannya. Tidak menghapus data lain.

```bash
# Repaired
node --env-file=.env.local scripts/smoke-db.mjs
# Vulnerable, di folder & server versi vulnerable
node --env-file=.env.local scripts/smoke-db.mjs --vulnerable
```

Script memeriksa persistensi row, hash password, login dua identifier, penolakan tanpa sesi, identitas penulis, pencarian SQLi, traversal, dan pencabutan sesi. Script tidak mengeksekusi JavaScript browser sehingga alert XSS tetap diuji manual. Jangan gunakan screenshot hasil yang belum kamu jalankan sebagai bukti laporan.

## UI dan publikasi
- [ ] Buka di ponsel dan desktop: foto kelompok tidak terpotong, form tidak keluar layar.
- [ ] Semua form bisa dipakai dengan keyboard, fokus terlihat, pesan error terbaca.
- [ ] Izin publikasi foto dan identitas siswa sudah dipastikan.
- [ ] .env.local, dump DB, cookie, dan node_modules tidak ikut commit.
- [ ] Branch vulnerable tidak menjadi target deployment/preview publik.

Isi laporan: versi/commit, tanggal, input, hasil yang diharapkan, hasil aktual, screenshot sendiri, lalu kesimpulan. Jangan memasukkan password asli atau token sesi.
