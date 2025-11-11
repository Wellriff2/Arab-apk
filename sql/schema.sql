-- Database schema untuk aplikasi Pembelajaran Bahasa Arab

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table untuk menyimpan data siswa
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk chapter/bab pembelajaran
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    semester INTEGER NOT NULL,
    icon VARCHAR(10) NOT NULL,
    title_arabic VARCHAR(200) NOT NULL,
    title_indonesian VARCHAR(200) NOT NULL,
    subtitle VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk konten materi
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL CHECK (section IN ('mufrodat', 'qiroah', 'hiwar', 'qowaid', 'quiz')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_names TEXT[] DEFAULT '{}',
    file_types TEXT[] DEFAULT '{}',
    file_sizes TEXT[] DEFAULT '{}',
    file_contents TEXT[] DEFAULT '{}',
    file_datas TEXT[] DEFAULT '{}',
    file_count INTEGER DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk hasil quiz siswa
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    answers JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk teachers/admin
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table untuk sessions/login (opsional, untuk extended features)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'teacher')),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default chapters data
INSERT INTO chapters (semester, icon, title_arabic, title_indonesian, subtitle) VALUES
(1, '👋', 'التحيات والتعارف', 'Salam dan Perkenalan', 'Belajar menyapa dan memperkenalkan diri'),
(1, '👨‍👩‍👧‍👦', 'الأسرة', 'Keluarga', 'Kosakata tentang anggota keluarga'),
(1, '🏫', 'المدرسة', 'Sekolah', 'Kata-kata terkait lingkungan sekolah'),
(2, '🌅', 'الْحَيَاةُ الْيَوْمِيَّةُ', 'Kehidupan Sehari-hari', 'Aktivitas sehari-hari dalam bahasa Arab'),
(2, '⚽', 'الهواية', 'Hobi', 'Menjelaskan hobi dan kegiatan favorit'),
(2, '🍽️', 'الطعام و الشراب', 'Makanan dan Minuman', 'Kosakata makanan dan minuman');

-- Insert default teacher account (password: guru123)
INSERT INTO teachers (username, password_hash, name) VALUES
('guru', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Guru Bahasa Arab');

-- Create indexes untuk performa
CREATE INDEX idx_contents_chapter_section ON contents(chapter_id, section);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_quiz_results_student_chapter ON quiz_results(student_id, chapter_id);
CREATE INDEX idx_quiz_results_completed_at ON quiz_results(completed_at);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Create function untuk update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers untuk auto update updated_at
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at 
    BEFORE UPDATE ON contents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON teachers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View untuk mendapatkan data konten dengan informasi chapter
CREATE VIEW content_with_chapters AS
SELECT 
    c.*,
    ch.semester,
    ch.icon as chapter_icon,
    ch.title_arabic as chapter_title_arabic,
    ch.title_indonesian as chapter_title_indonesian,
    ch.subtitle as chapter_subtitle
FROM contents c
LEFT JOIN chapters ch ON c.chapter_id = ch.id;
