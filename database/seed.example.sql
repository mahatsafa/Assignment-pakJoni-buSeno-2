-- Contoh format data. Data siswa asli tetap berada di database tim.
-- Sesuaikan kolomnya, lalu jalankan hanya jika membutuhkan data uji baru.
-- Database dipilih lewat argumen CLI.

INSERT INTO siswa (
  nama_lengkap,
  nama_panggilan,
  kelas,
  keahlian,
  skill,
  minat_hobi,
  cita_cita,
  deskripsi,
  foto
) VALUES (
  'Siswa Contoh',
  'Contoh',
  'XI TKJ 3',
  'Network & System Administration',
  'Linux, routing, troubleshooting',
  'Belajar teknologi dan olahraga',
  'Network Engineer',
  'Siswa XI TKJ 3 yang tertarik pada jaringan dan keamanan sistem.',
  NULL
);
