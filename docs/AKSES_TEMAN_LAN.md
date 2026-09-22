# Akses website praktikum dari laptop teman

## Kondisi laptopmu

Container app sudah Up dan MariaDB healthy. Port yang sebelumnya terbit adalah
`127.0.0.1:3001->3000/tcp`, sehingga aksesnya terbatas pada laptop sendiri.
IP Wi-Fi yang kamu kirim adalah **10.132.14.120/25** pada wlan0. Untuk teman
di jaringan Wi-Fi yang saling dapat terhubung, gunakan IP tersebut.

Patch ini menghubungkan pengaturan port Docker, Host yang diterima aplikasi,
APP_ORIGIN, akses aset Next.js, dan cookie login melalui satu pengaturan
`PRACTICE_HOST`. Pengaturan default tetap 127.0.0.1 sampai script dijalankan.
Database tetap memakai koneksi internal container dan volume yang sama.

## Pasang dan jalankan

Simpan ZIP di Downloads. Jalankan perintah satu per satu; jika ada error, berhenti
pada perintah yang gagal dan kirim pesannya. Perintah ini bisa dipakai di fish/Bash.

```sh
cd ~/Kelas/web_kelas/web
unzip -o ~/Downloads/XI-TKJ-3-akses-teman-LAN.zip -d .
node scripts/set-practice-host.mjs 10.132.14.120 3001
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build --force-recreate -d
docker compose --env-file .env.docker.local -f docker-compose.practice.yml ps
```

Script mengubah hanya PRACTICE_HOST dan PRACTICE_WEB_PORT pada .env.docker.local.
Password database dan konfigurasi lain dipertahankan. Script memeriksa bahwa IP
yang dipilih ada pada laptopmu. Jika IP Wi-Fi telah berubah, pakai hasil terbaru
dari `ip -br -4 addr`.

`--force-recreate` membuat ulang container app dan db agar app ikut memakai
namespace jaringan db yang baru. Volume database tetap dipakai. Tidak ada
perintah penghapusan volume atau impor ulang data dalam langkah di atas.

Hasil PORTS yang diharapkan pada service db:

```text
10.132.14.120:3001->3000/tcp
```

PORTS app boleh kosong: app berbagi jaringan dengan db. Tulisan `3306/tcp`
tanpa pemetaan `alamat:port->3306` tidak berarti port MariaDB dipublikasikan.

**Kamu dan temanmu membuka alamat yang sama:**

http://10.132.14.120:3001

Gunakan alamat itu juga untuk daftar akun, login, dan komentar. Login ulang
karena cookie pada 127.0.0.1 tidak ikut dikirim browser ke 10.132.14.120.
Pada konfigurasi LAN ini port dipasang pada IP terpilih; URL localhost lama
tidak lagi menjadi alamat akses host. Akun praktikum tetap memakai email .test.

## Jika teman masih belum bisa membuka

1. Pastikan alamat di kolom PORTS sudah berubah. Jika masih 127.0.0.1, pastikan
   menggunakan file compose dan file env yang sama dengan perintah di atas.
2. Dari laptopmu, buka http://10.132.14.120:3001/login terlebih dahulu.
3. Dari laptop teman, uji:

```sh
curl -i --max-time 30 http://10.132.14.120:3001/api/auth/me
```

- **401**: koneksi sampai ke aplikasi; belum login adalah kondisi normal untuk curl.
- **503 dengan pesan alamat belum diizinkan**: cek apakah patch sudah masuk image
  dan PRACTICE_HOST/APP_ORIGIN sudah sesuai.
- **Connection refused/timeout**, sementara URL IP LAN bisa dibuka di laptopmu:
  perlu mengecek jalur jaringan, firewall, atau isolasi antarperangkat di Wi-Fi.
  Berada pada nama Wi-Fi yang sama belum menjamin perangkat dapat saling terhubung.
  Kirim hasil curl dan IP teman untuk pemeriksaan lanjutan; jangan mematikan seluruh firewall.
- **403 saat daftar/login**: buka URL IP LAN yang sama, termasuk port 3001.

Lihat log aplikasi tanpa membuka isi file password:

```sh
docker compose --env-file .env.docker.local -f docker-compose.practice.yml logs --tail=50 app
```

Jika perlu memeriksa database lagi:

```sh
docker compose --env-file .env.docker.local -f docker-compose.practice.yml exec app node scripts/check-db.mjs
```

Teman harus mempunyai jalur jaringan ke IP yang dipilih. Alamat 10.132.14.120
bukan URL internet publik. Jika yang dipakai adalah jaringan ZeroTier bersama,
pilih alamat interface ZeroTier milik laptopmu melalui script yang sama; semua
peserta lalu memakai alamat itu. Alamat VPN hanya dapat dijangkau oleh peserta
yang memang terhubung dan diizinkan dalam jaringan tersebut.

## Kembali ke akses laptop sendiri

```sh
node scripts/set-practice-host.mjs 127.0.0.1 3001
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --force-recreate -d
```

Sesudah itu buka http://127.0.0.1:3001.

## Cakupan dan pengujian

Patch tetap memakai versi praktikum development. Pembatasan Host menerima
alamat loopback atau satu IP privat dan port yang dikonfigurasi; ini pembatasan
alamat website, bukan autentikasi peserta jaringan. Perangkat lain yang dapat
menjangkau port tersebut juga dapat membuka halaman. Contoh SQLi, XSS, dan
Path Traversal tetap mengikuti versi praktikum yang sudah ada.

Pemeriksaan unit mencakup Host, Origin, cookie login HTTP/HTTPS, port berbeda,
mode production, IP yang tidak dipilih, dan pemeliharaan password oleh script.
Lint dan TypeScript diperiksa. Pengujian HTTP memakai header Host/Origin LAN
yang disimulasikan dengan DATA_SOURCE=mock; tidak menguji Wi-Fi atau database
pada laptopmu. Docker Engine tidak tersedia dalam lingkungan pengujian patch.

Referensi perilaku port Docker:
https://docs.docker.com/engine/network/port-publishing/
