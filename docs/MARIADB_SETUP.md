# Menghubungkan ke MariaDB
Jangan menghapus database/data siswa yang sudah bekerja. Simpan backup lokal sebelum migrasi dan jangan upload backup ke GitHub. Tidak ada koneksi database tim atau server produksi yang diubah oleh paket ini.

## 1. Pastikan server dan client ada
Jika `mariadb: command not found`, client belum terpasang atau tidak ada di PATH; itu bukan error Next.js. Untuk Debian/Ubuntu/WSL Ubuntu:

```bash
sudo apt update
sudo apt install mariadb-server mariadb-client
sudo systemctl start mariadb
sudo mariadb
```

Pada WSL tanpa systemd gunakan `sudo service mariadb start`. Distro lain memakai langkah instalasi berbeda. Jalankan Next.js dan MariaDB dalam lingkungan WSL yang sama agar `127.0.0.1` menunjuk server yang sama.

## 2. Database yang sudah ada
Di direktori project, jalankan dengan akun administrator MariaDB (ganti `tkj3_profile` dengan DB_NAME milikmu):

```bash
sudo mariadb tkj3_profile < database/migrations/001_add_student_comments.sql
sudo mariadb tkj3_profile < database/migrations/002_add_accounts.sql
```

Keduanya memakai CREATE TABLE IF NOT EXISTS, tidak menghapus atau mereset siswa/komentar lama. Migrasi 002 menambah:
- `users`: id, username unik, email unik, password_hash, created_at.
- `sessions`: token_hash, user_id, expires_at, created_at.

Jika sudah ada tabel bernama users/sessions dengan struktur berbeda, periksa `SHOW CREATE TABLE` dahulu; migrasi ini tidak otomatis mengubah tabel yang bertabrakan. Registrasi tidak membuat profil siswa baru; tabel siswa dan akun login sengaja terpisah.

## 3. Instalasi baru
```bash
sudo mariadb < database/schema.sql
sudo mariadb tkj3_profile < database/migrations/002_add_accounts.sql
sudo mariadb tkj3_profile < database/seed.example.sql
```

Seed contoh menambah satu siswa dummy, bukan 32 data asli. Jangan mengimpor seed berulang jika tidak ingin duplikasi. Database dump teman bisa diimpor **setelah diperiksa nama database, struktur, dan perintah DROP-nya**; dump tidak disertakan paket ini. Repo juga mempertahankan seed Docker yang sudah ada; tinjau isinya sebelum dipakai.

## 4. Akun database aplikasi
Masuk sebagai admin: `sudo mariadb`, lalu buat user khusus. Contoh TCP loopback yang cocok dengan DB_HOST=127.0.0.1:

```sql
CREATE USER IF NOT EXISTS 'tkj_app'@'127.0.0.1' IDENTIFIED BY 'PASSWORD_LOKAL_YANG_KAMU_PILIH';
GRANT SELECT, INSERT, UPDATE, DELETE ON tkj3_profile.* TO 'tkj_app'@'127.0.0.1';
```

Jangan gunakan root dalam aplikasi. Hak CREATE untuk migrasi dimiliki admin, tidak diperlukan akun aplikasi. Jangan beri hak FILE atau hak global. Jika user sudah ada, CREATE USER IF NOT EXISTS **tidak mengganti password**.

## 5. Environment
File `.env.local` harus berisi konfigurasi nyata perangkatmu:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tkj_app
DB_PASSWORD=PASSWORD_LOKAL_YANG_KAMU_PILIH
DB_NAME=tkj3_profile
DATA_SOURCE=mariadb
NEXT_PUBLIC_SCHOOL_NAME=Nama Sekolahmu
APP_ORIGIN=http://127.0.0.1:3000
```

Untuk password dengan `#`, bungkus nilainya dengan tanda kutip. DB_PASSWORD adalah password **user MariaDB**, bukan password akun yang dibuat di form website. Jangan kirim file ini atau isi password ke chat.

```bash
mariadb --protocol=TCP -h 127.0.0.1 -P 3306 -u tkj_app -p tkj3_profile
npm run db:check
npm run dev
```

Perintah pertama meminta password secara interaktif. db:check memeriksa tabel siswa, komentar, users, dan sessions, tanpa menampilkan password.

## 6. Jika gagal
- `Cannot find package mysql2`: jalankan `npm ci` dari folder yang mempunyai package.json.
- `Access denied`: server dapat dihubungi, tetapi autentikasi/izin gagal. Penyebab bisa password, pemilihan akun host, plugin, atau izin database. Error ini **tidak otomatis berarti host salah**.
- Sebagai admin, periksa `SELECT User, Host, plugin FROM mysql.user WHERE User='tkj_app';` dan `SHOW GRANTS FOR 'tkj_app'@'127.0.0.1';`. Sesuaikan akun host yang benar dan password melalui ALTER USER bila memang perlu; jangan membuka akses host `%` tanpa kebutuhan.
- `ECONNREFUSED`: server belum hidup atau host/port salah.
- `ER_NO_SUCH_TABLE`: migrasi belum dijalankan di database yang dipilih.
- `403` saat login: alamat browser tidak sama dengan APP_ORIGIN; periksa port dan restart dev server.
- Preview UI berjalan, login 503: ganti DATA_SOURCE dari mock menjadi mariadb.
- Restart Next.js setelah mengubah environment.

## 7. Khusus versi rentan
Gunakan database **terpisah** bernama `tkj3_practice` di MariaDB lokal:

```bash
sudo mariadb < database/practice-schema.sql
sudo mariadb tkj3_practice < database/migrations/002_add_accounts.sql
sudo mariadb tkj3_practice < database/seed.example.sql
```

Jangan hubungkan ke database asli atau server publik. Buat user DB berbeda, misalnya `tkj_practice`, dengan password tersendiri dan hanya hak SELECT, INSERT, UPDATE, DELETE pada `tkj3_practice.*`, bukan pada kedua database. Isi DB_USER/DB_PASSWORD akun tersebut pada .env.local versi vulnerable.

Sebagai administrator MariaDB:

```sql
CREATE USER IF NOT EXISTS 'tkj_practice'@'127.0.0.1' IDENTIFIED BY 'PASSWORD_KHUSUS_LATIHAN';
GRANT SELECT, INSERT, UPDATE, DELETE ON tkj3_practice.* TO 'tkj_practice'@'127.0.0.1';
```

Ganti placeholder password dengan nilai yang kamu pilih sendiri. Pada .env.local versi vulnerable gunakan DB_USER=tkj_practice, DB_NAME=tkj3_practice, dan DB_PASSWORD yang sama dengan akun DB latihan tersebut. Ini berbeda dari akun web yang nanti dibuat melalui /register.

Nama akun/email latihan harus dummy; versi vulnerable menerima email dengan domain berakhiran `.test`. Password tetap di-hash. Memisahkan database membatasi data yang bisa terbaca oleh SQL Injection.

## 8. Docker alternatif (versi repaired)
Docker bersifat opsional. Isi DB_PASSWORD dan tambahkan DB_ROOT_PASSWORD di .env.local, lalu:

```bash
docker compose --env-file .env.local up --build
```

Compose memakai database `tkj3_profile`, user `tkj_app`, volume tersendiri, dan port web hanya 127.0.0.1. Skrip init berjalan **hanya pada volume baru**. Untuk volume lama jalankan migrasi akun:

```bash
docker compose --env-file .env.local exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' < database/migrations/002_add_accounts.sql
```

Mengganti password environment tidak mengubah user di volume lama. Jangan menghapus volume untuk memperbaiki autentikasi; sesuaikan akun yang sudah ada. Versi vulnerable memerlukan `npm run dev` lokal, bukan image production ini.
