-- Jalankan migration ini pada database lama yang tabel `siswa`-nya sudah ada.
-- Database dipilih lewat argumen CLI; tidak mengubah database aktif.

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
