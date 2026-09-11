# Catatan verifikasi — 10 September 2026

Environment: Node.js 24.19.0, Next.js 16.3.3. MariaDB dan Docker daemon tidak tersedia; tidak ada kredensial database pengguna yang dipakai.

| Pemeriksaan | Repaired | Vulnerable |
| --- | --- | --- |
| ESLint + TypeScript | Lulus | Lulus |
| Unit test | 10 lulus | 14 lulus |
| next build | Lulus | Lulus, tetapi production ditolak |
| Hash password + validasi | Diuji unit | Diuji unit |
| API file normal | HTTP 200 | HTTP 200 |
| Traversal ke fixture | HTTP 400 | HTTP 200; isi penanda sesuai |
| Pembacaan .env.local | HTTP 400 | HTTP 400 |
| Runtime production | Versi untuk review/deployment aman | HTTP 503 pada halaman, search, dan file |
| Runtime Host publik | Tidak dibatasi localhost | HTTP 503 pada raw Host/forwarded Host |
| Register/login tersimpan di MariaDB | Belum dijalankan | Belum dijalankan |
| SQL Injection dieksekusi MariaDB | Belum dijalankan | Belum dijalankan |
| Stored XSS berjalan di browser | Belum dijalankan | Belum dijalankan |

Tes HTTP memakai DATA_SOURCE=mock, kecuali akses file yang benar-benar membaca fixture lokal. Tidak ada browser automation/visual QA. Tidak ada screenshot hasil serangan yang dibuat-buat.

Catatan teknis pengujian: Next.js dapat mengirim redirect halaman /akun lewat streaming (HTTP 200 lalu instruksi redirect), jadi status 307 tidak boleh menjadi satu-satunya bukti auth. Endpoint /api/auth/me tetap memerlukan sesi. Untuk pengujian Host gunakan node:http dengan header eksplisit; fetch dapat mengganti/mengabaikan Host buatan.

Untuk menguji integrasi yang belum dijalankan, gunakan scripts/smoke-db.mjs pada database latihan lokal, lalu checklist browser manual di docs/CHECKLIST.md. Laporan ini mencatat cakupan nyata, bukan audit keamanan produksi.
