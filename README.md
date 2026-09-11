# Website Kelas XI TKJ 3 — foto kelas & akun
> **PAKET VULNERABLE:** hanya `npm run dev` di localhost. Database harus lokal dan bernama berakhiran `_practice` atau `_test`. Jangan deploy atau pakai kredensial asli.

Next.js App Router + React + TypeScript + Tailwind CSS + MariaDB.
Pembaruan berdasarkan GitHub main commit `a584f32`, 10 September 2026. Tidak ada push atau deployment otomatis.

## Mulai dari sini
- Foto kelas asli di beranda dan halaman akun, tanpa memotong foto.
- Daftar siswa, pencarian, profil, komentar, dan pembuka foto tetap di website yang sama.
- `/register`: buat username, email, dan password sendiri.
- `/login`: masuk dengan username **atau** email.
- `/akun`: lihat identitas sendiri dan logout.
- Komentar baru memerlukan login; penulis diambil dari sesi server.
- Akun dan sesi disimpan di MariaDB. Password di-hash dengan scrypt + salt, bukan plaintext.
- Tidak ada pengiriman email, verifikasi kepemilikan email, atau reset password.

## Dua paket source, website yang sama
| Paket / branch lokal | Isi |
| --- | --- |
| `feature/class-photo-auth` / ZIP repaired | Tiga celah diperbaiki. Basis untuk melanjutkan versi publik setelah review. |
| `practice/class-photo-auth` / ZIP vulnerable | Celah sengaja berada pada pencarian, komentar, dan pembuka foto. Hanya localhost dan akun dummy. |

Tidak ada dashboard lab atau tombol mengganti mode. Gunakan folder dan database berbeda untuk kedua versi. Jangan mengekstrak versi repaired di atas folder vulnerable: file khusus versi rentan bisa tertinggal.

## Menjalankan
Gunakan Node.js **24 LTS** untuk seluruh perintah termasuk test TypeScript. Node 20 milikmu dapat menjalankan sebagian perintah, tetapi runner test project ini membutuhkan dukungan TypeScript bawaan Node yang lebih baru.

```bash
npm ci
```

Jika belum ada `.env.local`, salin `.env.example`. Jika sudah ada, **jangan hapus isinya**; tambahkan `APP_ORIGIN=http://127.0.0.1:3000` dan pertahankan kredensial database yang benar. Nilai contoh password bukan password MariaDB yang otomatis dibuat.

Ikuti [MARIADB_SETUP.md](docs/MARIADB_SETUP.md) untuk migrasi. Kemudian:

```bash
npm run db:check
npm run dev
```

Buka **http://127.0.0.1:3000**. Jangan berganti ke `localhost` jika APP_ORIGIN memakai `127.0.0.1`; origin harus sama persis.

Buka Daftar untuk membuat akun. Untuk latihan gunakan `siswa_demo`, email `siswa@example.test`, dan password baru 12–128 karakter yang hanya dipakai untuk tugas ini. Tidak ada akun admin tersembunyi atau password bawaan.

`DATA_SOURCE=mock` hanya untuk melihat UI tanpa MariaDB. Login/registrasi tidak tersedia dan SQL Injection tidak dapat dibuktikan pada mock; tidak ada fallback database diam-diam.

## Pemeriksaan
```bash
npm run check
npm run build
```
Build tidak membuktikan koneksi database. Uji dengan MariaDB mengikuti [CHECKLIST.md](docs/CHECKLIST.md). Pada versi vulnerable, hasil build tidak boleh dipublikasikan dan permintaan production ditolak.

## Dokumentasi
- [Integrasi MariaDB](docs/MARIADB_SETUP.md)
- [Praktikum langsung di fitur website](docs/VULNERABLE_VERSION.md)
- [Analisis penyebab, dampak, dan perbaikan](docs/SECURITY_ANALYSIS.md)
- [Checklist pengujian](docs/CHECKLIST.md)
- [Cara push tanpa menimpa main](docs/PUSH_GITHUB.md)

## Sebelum dibagikan
Jangan commit `.env.local`, password, session cookie, database dump, atau `node_modules`. ZIP source tidak menyertakan file tersebut maupun riwayat Git lama. Foto siswa dari repo dipertahankan; pastikan izin sekolah/teman sebelum publikasi foto dan identitas. Hanya data dummy untuk akun praktikum.

Versi repaired memperbaiki tiga celah yang dibahas, **bukan sertifikasi keamanan produksi**. Rate limit masih per proses, email belum diverifikasi, belum ada pemulihan akun dan moderasi komentar. Deployment publik memerlukan HTTPS, review keamanan, kebijakan data siswa, dan pembatasan registrasi yang sesuai. Jangan deploy versi vulnerable.
