# Mengembalikan daftar dan foto siswa

Paket website menyimpan 32 foto siswa di public/uploads/siswa. Database latihan baru tkj3_practice sebelumnya hanya diisi Siswa Contoh dengan foto NULL. Karena daftar ditarik dari database, file foto di folder saja belum membuat 32 card siswa muncul.

Ekstrak XI-TKJ-3-restore-foto-siswa.zip di folder project yang berisi package.json, kemudian jalankan:

```bash
node --env-file=.env.local scripts/restore-student-photos.mjs
```

Script memakai mysql2 yang sudah terpasang dan konfigurasi .env.local yang sudah bekerja. Kompatibel dengan Node.js 20.20.2. Jalankan tanpa sudo; akun DB aplikasi hanya memerlukan hak SELECT, INSERT, UPDATE seperti yang sudah diberikan.

- Menambahkan nama, kelas, dan nama file foto untuk siswa yang belum ada.
- Mengisi foto yang masih NULL/kosong pada siswa yang sudah ada.
- Mempertahankan ID, biodata, foto pilihan yang sudah terisi, akun, sesi, dan komentar.
- Melewati nama/foto yang ambigu agar tidak menggabungkan orang yang salah.
- Bisa dijalankan ulang tanpa menggandakan data pada pemakaian berurutan; jangan menjalankan dua pemulihan bersamaan.
- Tidak menghapus Siswa Contoh yang sebelumnya diimpor. Jumlah total dapat menjadi 33 jika contoh itu masih ada.

Nama dan pemetaan foto bersumber dari seed repo asli docker/initdb/02-seed-siswa.sql. Skill, hobi, cita-cita, dan deskripsi yang tidak ada pada seed tidak dikarang. Jika biodata lengkap hanya ada pada database lama, diperlukan pemindahan data tersebut secara terpisah.

Setelah selesai, buka /siswa dan refresh. Jika dev server belum berjalan, jalankan npm run dev. Pemulihan ini tidak mengubah DB_NAME ke database asli atau menghubungkan aplikasi rentan ke server publik.

Jangan langsung mengimpor seed Docker ke database latihan: seed tersebut memuat USE tkj3_profile sehingga dapat mengubah database yang berbeda dari yang dimaksud. Script pemulihan ini hanya memakai DB_NAME yang berakhiran _practice atau _test pada server lokal.

Verifikasi pengembangan: seluruh nama file dicocokkan ke foto di paket, dan logika idempotensi, pelestarian data, konflik identitas, serta rollback diuji dengan koneksi uji. Belum dieksekusi terhadap server MariaDB pengguna.
