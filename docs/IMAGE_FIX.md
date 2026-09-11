# Perbaikan gambar — 11 September 2026

Error `The requested resource isn't a valid image ... received null` berhasil direproduksi pada versi vulnerable: foto kelas dan foto siswa langsung mengembalikan HTTP 200 image/png atau image/jpeg, sedangkan URL `/_next/image?...` mengembalikan HTTP 400.

Penyebab pada paket ini: `fetchInternalImage` milik Next.js 16.3.3 membuat request internal tanpa header Host. Proxy lokal menolak request itu, lalu optimizer menerima teks penolakan, bukan gambar. Ini tidak berarti file PNG aslinya rusak.

## Dua perubahan
1. Di `next.config.ts`, `images: { unoptimized: true }` membuat semua Next Image pada versi praktikum mengambil file asli secara langsung. `turbopack.root` juga ditetapkan ke process.cwd() agar folder induk tidak terpilih akibat lockfile tambahan.
2. Di `app/layout.tsx`, elemen html diberi `data-scroll-behavior="smooth"` sesuai CSS yang sudah ada.

Proxy dan pemeriksaan akses lokal tetap aktif. Gambar tidak lagi di-resize atau dikonversi otomatis; foto kelas tetap berukuran asli sekitar 2,3 MB. Pilihan ini cocok untuk praktikum localhost, bukan pengaturan optimisasi untuk versi publik.

## Cara memasang di project yang sudah berjalan
Tidak perlu mengimpor ulang database, mengganti .env.local, atau menginstal ulang dependency. Pertahankan perubahan lokalmu: tambahkan blok images tersebut sejajar dengan turbopack di objek nextConfig, dan tambahkan atribut pada html. Jangan membuat blok turbopack kedua jika sebelumnya sudah ditambahkan.

Hentikan server, jalankan `npm run dev`, lalu muat ulang browser dengan Ctrl+Shift+R. Periksa beranda, login, daftar siswa, dan profil.

## Verifikasi
Reproduksi HTTP sebelum perbaikan berhasil membedakan file valid dari optimizer yang gagal. Setelah perbaikan, ESLint dan TypeScript lulus. Uji offline menggunakan fungsi getImgProps Next.js memeriksa bahwa semua foto dalam paket menghasilkan src langsung, tanpa srcSet optimizer. File gambar asli tidak dimodifikasi.

Uji HTTP setelah perbaikan tidak selesai karena sesi pengujian jaringan dibatalkan oleh lingkungan. Karena itu tidak ada klaim bahwa browser di laptop pengguna sudah diuji. Verifikasi kembali setelah restart lokal.

Referensi: [Next.js Image unoptimized](https://nextjs.org/docs/app/api-reference/components/image#unoptimized) dan [atribut smooth scroll](https://nextjs.org/docs/messages/missing-data-scroll-behavior).
