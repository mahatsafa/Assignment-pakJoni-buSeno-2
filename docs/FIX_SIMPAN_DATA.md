# Perbaikan penyimpanan akun dan komentar — 16 September 2026

## Temuan pada ZIP

Pesan `Permintaan harus berasal dari website ini.` berasal dari pemeriksaan Origin,
sebelum API menjalankan INSERT ke MariaDB. Compose menetapkan APP_ORIGIN ke
`http://127.0.0.1:<PRACTICE_WEB_PORT>`. Kode sebelumnya menolak browser yang membuka
`http://localhost:<port-yang-sama>`. Perbedaan ini berhasil direproduksi dari kode ZIP.
Alamat browser dan konfigurasi runtime milikmu belum tersedia, sehingga kondisi
MariaDB di laptop belum dapat dipastikan hanya dari arsip source code.

Patch ini mengizinkan alias localhost/127.0.0.1/[::1] hanya pada mode development,
dengan protokol dan port yang sama. Alamat asing, Origin kosong, dan port berbeda
tetap ditolak. Pesan penolakan sekarang menyebutkan alamat yang perlu dibuka.
Trailing slash pada konfigurasi APP_ORIGIN juga dinormalisasi.

Kode INSERT akun dan komentar sudah menggunakan MariaDB. Akun baru masuk tabel
`users`, sesi login masuk `sessions`, dan komentar masuk `student_comments`.
Pendaftaran akun **tidak menambahkan siswa ke tabel `siswa`** dan tidak otomatis login.
Sesudah berhasil mendaftar, masuk melalui halaman login sebelum mengirim komentar.

## Terapkan pada folder web yang kamu kirim

Simpan ZIP patch di Downloads. Perintah berikut bisa dijalankan dari fish maupun Bash:

```sh
cd ~/Kelas/web_kelas/web
unzip -o ~/Downloads/XI-TKJ-3-fix-simpan-data.zip -d .
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build -d
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec app node scripts/check-db.mjs --write
```

ZIP hanya mengganti helper Origin, script pengecekan database, dan pengujian;
serta menambahkan dokumen ini. Foto, data siswa, password/env, skema, volume
MariaDB, dan contoh kerentanan tidak diubah oleh patch.

`--build` diperlukan karena source dimasukkan ke image lewat COPY. `up -d` saja
dapat menggunakan kode lama. Selalu sertakan `--env-file` dan `-f` di atas supaya
yang berjalan adalah konfigurasi Docker praktikum yang benar.

## Arti hasil pemeriksaan

Script menggunakan environment **di dalam container app**, yaitu konfigurasi
yang digunakan website. Perintah `npm run db:check` di laptop menggunakan
`.env.local` laptop dan bisa memeriksa database yang berbeda.

Script menampilkan alamat browser, nama database, jumlah siswa/komentar/akun,
lalu menguji INSERT/SELECT akun dan komentar serta INSERT/SELECT/DELETE sesi.
Transaksi uji di-rollback; tidak meninggalkan akun, sesi, atau komentar.
Nomor AUTO_INCREMENT bisa bertambah meskipun row di-rollback. Uji komentar
ditandai SKIP jika belum ada siswa di database. Script memerlukan tabel InnoDB.

Jika semua pemeriksaan bertuliskan PASS, buka alamat yang dicetak oleh script.
Jika PRACTICE_WEB_PORT=3001, alamatnya http://127.0.0.1:3001.
Gunakan alamat yang sama saat daftar, login, dan mengirim komentar; cookie login
untuk localhost dan 127.0.0.1 disimpan browser secara terpisah.

| Hasil | Makna dan tindakan |
| --- | --- |
| 403 dengan petunjuk alamat | Origin/port browser belum sesuai. Buka alamat yang dicetak; jika pesan masih versi lama, rebuild app. |
| ER_ACCESS_DENIED_ERROR | User/password tidak cocok dengan MariaDB pada volume yang sudah ada. Jangan mengganti password acak lagi; periksa konfigurasi yang sebelumnya dipakai. |
| ER_TABLEACCESS_DENIED_ERROR / ER_DBACCESS_DENIED_ERROR | Hak akses akun aplikasi kurang. Gunakan langkah izin di bawah hanya jika error ini muncul. |
| ER_NO_SUCH_TABLE | Skema/migrasi belum lengkap pada database tersebut. Catat tabel yang hilang. |
| ECONNREFUSED / ETIMEDOUT | App belum terhubung ke MariaDB; periksa status db dan jalankan pengecekan dari container app. |
| DATA_SOURCE=mock | Mode mock tidak menyimpan ke MariaDB. Compose praktikum yang ada pada ZIP menetapkan DATA_SOURCE=mariadb. |
| Jumlah akun bertambah, jumlah siswa tetap | Normal: akun login dan profil siswa adalah tabel berbeda. |

Jika hak akses ditolak, file izin dalam ZIP sudah berisi nama grant MariaDB yang
benar. Terapkan ke database yang sedang berjalan tanpa menghapus volume:

```sh
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec -T db sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb --protocol=socket -uroot' < docker/practice-init/04-permissions.sql
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec app node scripts/check-db.mjs --write
```

Jangan menjalankan `down -v` untuk mengatasi masalah ini: opsi tersebut menghapus
volume database. Tidak perlu mengimpor ulang 32 siswa untuk memperbaiki Origin.

Jika masih gagal, kirim output dua perintah ini, ditambah alamat browser yang dibuka:

```sh
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec app node scripts/check-db.mjs --write
docker compose --env-file .env.docker.local -f docker-compose.practice.yml logs --tail=50 app
```

Jangan kirim isi file env atau password.

## Ruang lingkup deployment

Ini patch untuk versi praktikum Docker lokal dari ZIP yang kamu unggah. `proxy.ts`
dan `practice-guard.ts` pada versi ini memang menolak production/host publik.
Karena itu arsip ini tidak dapat langsung menjadi backend akun di Vercel.
Database Docker di laptop juga berbeda dari database pada deployment publik.

## Verifikasi patch

- Regresi Origin diuji, termasuk port browser yang berbeda dari port internal Docker.
- Unit test, lint, dan pemeriksaan TypeScript dijalankan saat menyiapkan patch.
- Uji HTTP pemeriksaan Origin memakai DATA_SOURCE=mock; ini bukan bukti INSERT MariaDB berhasil.
- Docker dan MariaDB milikmu belum dapat diakses dari lingkungan pemeriksaan.
  Gunakan `check-db.mjs --write` di container untuk memverifikasi izin tulis aktual.
