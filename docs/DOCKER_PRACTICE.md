# Menjalankan website praktikum dengan Docker

Patch ini dipakai dari folder project pada branch `tugas/foto-login-praktikum`.
Website Next.js dan MariaDB dijalankan sebagai dua container. Website dibuka di
http://127.0.0.1:3000. Ini menjalankan website di laptop; tidak memperbarui Vercel.

## Penyebab error sebelumnya

Docker Compose otomatis mencari `.env`, sedangkan konfigurasi Next.js memakai
`.env.local`. Untuk file bernama lain, gunakan `--env-file` secara eksplisit.
Konfigurasi Compose lama juga memakai Dockerfile production, DB_HOST=db, dan
database tkj3_profile. Ketiganya tidak sesuai dengan pemeriksaan versi praktikum.

Patch menggunakan Dockerfile development dan jaringan yang dibagi antara app
dan db (`network_mode: service:db`). Jadi app mengakses MariaDB melalui
127.0.0.1:3306. Aturan pada `proxy.ts` dan `lib/practice-guard.ts` tetap berlaku.
Port website dipublikasikan hanya ke 127.0.0.1. Port database tidak dipublikasikan.

## Mulai

Hentikan `npm run dev` yang masih memakai port 3000 dengan Ctrl+C. Dari folder web:

```bash
node scripts/prepare-practice-docker.mjs
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build -d
docker compose --env-file .env.docker.local -f docker-compose.practice.yml logs -f app
```

Persiapan menghasilkan dua password acak pada `.env.docker.local`, tanpa mengubah
`.env.local` milik instalasi MariaDB laptop. Jika dijalankan ulang, password yang
ada dipertahankan. Jangan mengunggah file password tersebut ke GitHub. Pola
`.env.*` pada `.gitignore` dan Dockerfile.practice.dockerignore mengecualikannya.

Tunggu sampai log menampilkan `Ready`, lalu buka http://127.0.0.1:3000.
Ctrl+C saat mengikuti log hanya menghentikan tampilan log; container tetap hidup.
Pembuatan image pertama memerlukan internet untuk mengambil Node, MariaDB, dan
dependency npm. Image app menggunakan Node 24 walaupun Node laptop versi 20.

## Database dan akun

Pada volume baru, MariaDB otomatis membuat tkj3_practice beserta tabel siswa,
student_comments, users, dan sessions. Seed berisi 32 nama siswa dan nama file
foto yang sudah ada di repo. Tidak ada profil Siswa Contoh. Biodata lain yang
belum tersedia pada seed tetap kosong.

Ini database latihan baru pada volume Docker terpisah. Akun, komentar, dan perubahan
biodata dari MariaDB laptop tidak otomatis ikut masuk. Data Docker bertahan saat
container dihentikan atau dijalankan ulang; inisialisasi hanya berjalan saat volume
database masih kosong. Jangan menghapus volume untuk mengatasi error password.

Tabel users awalnya kosong. Buka /register untuk membuat akun, misalnya username
faris_demo dan email faris@kelas.test dengan password khusus latihan minimal 12
karakter. Setelah login, gunakan pencarian dan komentar untuk presentasi SQLi/XSS.

Pemeriksaan DB dilakukan dari dalam container agar memakai konfigurasi yang sama:

```bash
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec app node scripts/check-db.mjs
```

## Operasi sehari-hari

Status:
```bash
docker compose --env-file .env.docker.local -f docker-compose.practice.yml ps
```

Log startup database jika app belum muncul:
```bash
docker compose --env-file .env.docker.local -f docker-compose.practice.yml logs --tail=80 db
```

Berhenti sambil menyimpan data:
```bash
docker compose --env-file .env.docker.local -f docker-compose.practice.yml stop
```

Jalankan kembali, atau terapkan perubahan source:
```bash
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build -d
```

Jika port 3000 dipakai layanan lain, edit PRACTICE_WEB_PORT=3001 di .env.docker.local,
jalankan ulang perintah up, dan buka http://127.0.0.1:3001. APP_ORIGIN mengikuti port
tersebut sehingga form login dan komentar tetap cocok dengan alamat website.

## Batas verifikasi

Konfigurasi YAML, file init, pemetaan 32 foto, dan perilaku script password diperiksa
di workspace pembuat patch. Docker Engine tidak tersedia di workspace tersebut;
build image dan startup dua container harus diverifikasi di laptop pengguna.

Referensi:
- https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
- https://docs.docker.com/reference/compose-file/services/#network_mode
- https://mariadb.com/docs/server/server-management/automated-mariadb-deployment-and-administration/docker-and-mariadb/mariadb-server-docker-official-image-environment-variables
