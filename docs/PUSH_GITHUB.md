# Push sendiri ke GitHub
Paket dibuat dari main `a584f32`. Tidak ada push yang dilakukan. Jangan menimpa main yang mungkin terhubung ke deployment.

## Cara termudah: clone baru dan branch baru
Simpan ZIP vulnerable di Downloads. Jalankan (sesuaikan path ZIP):

```bash
git clone https://github.com/muhammadanshori34tkj-web/Tugas_web_kelas.git web-kelas-praktikum
cd web-kelas-praktikum
git switch -c tugas/foto-login-praktikum
unzip /path/ke/XI-TKJ-3-vulnerable-update.zip
```

ZIP tidak punya folder pembungkus, sehingga ekstrak **di dalam clone baru**. Jika unzip meminta konfirmasi overwrite, setujui hanya untuk file source project dalam clone baru ini. Jangan ekstrak ke folder dengan perubahan lokal yang belum dicadangkan. ZIP tidak berisi .git atau .env.local.

Jika main sudah mempunyai perubahan lain sejak a584f32, jangan menimpa otomatis; bandingkan dahulu. Untuk ZIP repaired gunakan clone dan branch berbeda, misalnya `tugas/foto-login-repaired`. Jangan campur kedua ZIP dalam folder yang sama.

## Periksa sebelum commit
```bash
git status --short
git diff --stat
git diff --check
git check-ignore .env.local
git ls-files .env.local
npm run check
```

Jika .env.local ada, check-ignore harus mengenalinya. `git ls-files .env.local` harus kosong. .gitignore tidak menghapus secret yang sudah pernah ter-commit; jika itu terjadi, batalkan push, rotasi password dan bersihkan histori dengan bantuan pemilik repo.

Tambahkan file spesifik yang berubah. Untuk pembaruan ini:

```bash
git add app components lib public database docs scripts tests security-fixtures
git add README.md PROGRESS.md .gitignore .dockerignore .env.example docker-compose.yml
```

Pada **versi vulnerable**, tambahkan juga:
```bash
git add proxy.ts package.json
```

Lihat semua file yang akan dikirim:
```bash
git diff --cached --stat
git diff --cached --name-only
```

Tidak boleh ada .env.local, dump DB, cookie, node_modules, atau .next. Hindari mengunggah data siswa tanpa izin.

```bash
git commit -m "Add class photo, accounts and integrated security practice"
git push -u origin tugas/foto-login-praktikum
```

Jika memakai versi repaired, ganti nama branch dan pesan commit sesuai versi. Jangan force-push. Bila autentikasi GitHub diminta, gunakan mekanisme resmi GitHub (SSH atau login CLI/PAT), bukan memasukkan token ke source/.env.example. Jika akses ditolak, minta pemilik repo memberi akses; jangan mengganti remote diam-diam.

## Penting
Branch praktikum bukan target deployment dan jangan di-merge ke main. Upload source ke GitHub berbeda dengan menerbitkan aplikasi rentan. Pastikan integrasi hosting tidak otomatis menerbitkan branch praktikum/preview-nya.
