-- Seed data untuk aplikasi Pembelajaran Bahasa Arab

-- Sample content data
INSERT INTO contents (chapter_id, section, title, description, file_names, file_types, file_sizes, file_contents, file_datas, file_count) VALUES
(1, 'mufrodat', 'Kosakata Salam', 'Kumpulan kosakata untuk salam dan perkenalan', 
 '{"salam-dasar.pdf"}', 
 '{"application/pdf"}', 
 '{"2.1 MB"}', 
 '{"PDF"}', 
 '{"Konten PDF kosakata salam bahasa Arab"}', 
 1),
 
(1, 'qiroah', 'Teks Perkenalan Diri', 'Teks bacaan untuk memperkenalkan diri', 
 '{"teks-perkenalan.docx", "audio-pengucapan.mp3"}', 
 '{"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "audio/mpeg"}', 
 '{"156 KB", "1.8 MB"}', 
 '{"TEXT", "AUDIO"}', 
 '{"Nama saya Ahmad. Saya siswa kelas 10. Saya tinggal di Jakarta.", "https://example.com/audio/perkenalan.mp3"}', 
 2),
 
(2, 'mufrodat', 'Kosakata Keluarga', 'Nama-nama anggota keluarga dalam bahasa Arab', 
 '{"keluarga-bahasa-arab.pdf"}', 
 '{"application/pdf"}', 
 '{"1.8 MB"}', 
 '{"PDF"}', 
 '{"Konten PDF tentang kosakata keluarga"}', 
 1);

-- Sample quiz questions (disimpan sebagai content dengan section 'quiz')
INSERT INTO contents (chapter_id, section, title, description, file_names, file_types, file_sizes, file_contents, file_datas, file_count) VALUES
(1, 'quiz', 'Quiz Salam dan Perkenalan', 'Latihan soal untuk materi salam dan perkenalan', 
 '{"quiz-salam.json"}', 
 '{"application/json"}', 
 '{"45 KB"}', 
 '{"QUIZ"}', 
 {'{"questions": [
    {
      "question": "Apa arti dari \\"السلام عليكم\\"?",
      "options": ["Selamat pagi", "Selamat tinggal", "Salam sejahtera", "Terima kasih"],
      "correct": 2
    },
    {
      "question": "Kata \\"أب\\" dalam bahasa Indonesia berarti?",
      "options": ["Ibu", "Ayah", "Kakak", "Adik"],
      "correct": 1
    },
    {
      "question": "Bagaimana cara mengatakan \\"Sekolah\\" dalam bahasa Arab?",
      "options": ["البيت", "المدرسة", "المسجد", "السوق"],
      "correct": 1
    }
  ]}'}, 
 1);
