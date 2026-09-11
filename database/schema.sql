-- Skema instalasi baru untuk Website Profil XI TKJ 3.
-- Jalankan sebagai akun MariaDB yang memiliki izin membuat database/tabel.
-- Setelah ini, jalankan database/migrations/002_add_accounts.sql pada tkj3_profile.

CREATE DATABASE IF NOT EXISTS tkj3_profile
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tkj3_profile;

CREATE TABLE IF NOT EXISTS siswa (
  id INT NOT NULL AUTO_INCREMENT,
  nama_lengkap VARCHAR(150) NOT NULL,
  nama_panggilan VARCHAR(60) NULL,
  kelas VARCHAR(30) NOT NULL DEFAULT 'XI TKJ 3',
  keahlian VARCHAR(150) NULL,
  skill VARCHAR(255) NULL,
  minat_hobi VARCHAR(255) NULL,
  cita_cita VARCHAR(150) NULL,
  deskripsi TEXT NULL,
  foto VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_siswa_nama_lengkap (nama_lengkap),
  UNIQUE KEY uq_siswa_foto (foto)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  author_name VARCHAR(60) NOT NULL,
  content VARCHAR(500) NOT NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_comments_student_created (student_id, created_at),
  CONSTRAINT fk_comments_student
    FOREIGN KEY (student_id) REFERENCES siswa(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;
