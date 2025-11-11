// netlify/functions/database.js - CommonJS version (lebih kompatibel)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/database', '');
  const segments = path.split('/').filter(segment => segment);

  console.log('Database function called:', event.httpMethod, path);

  try {
    // Get all application data
    if (event.httpMethod === 'GET' && (!segments[0] || segments[0] === 'data')) {
      const client = await pool.connect();
      
      try {
        const studentsResult = await client.query('SELECT * FROM students ORDER BY created_at DESC');
        const contentsResult = await client.query(`
          SELECT c.*, ch.title_arabic, ch.title_indonesian 
          FROM contents c 
          LEFT JOIN chapters ch ON c.chapter_id = ch.id 
          ORDER BY c.created_at DESC
        `);
        const quizResults = await client.query('SELECT * FROM quiz_results ORDER BY completed_at DESC');

        const data = {
          students: studentsResult.rows,
          contents: contentsResult.rows,
          quizResults: quizResults.rows
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      } finally {
        client.release();
      }
    }

    // Students endpoints
    if (event.httpMethod === 'POST' && segments[0] === 'students') {
      const client = await pool.connect();
      
      try {
        const { id, name } = JSON.parse(event.body);
        
        // Check if student already exists
        const existingStudent = await client.query(
          'SELECT * FROM students WHERE id = $1 OR name = $2',
          [id, name]
        );

        if (existingStudent.rows.length > 0) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'Student already exists' })
          };
        }

        const result = await client.query(
          'INSERT INTO students (id, name) VALUES ($1, $2) RETURNING *',
          [id, name]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      } finally {
        client.release();
      }
    }

    // Contents endpoints
    if (event.httpMethod === 'GET' && segments[0] === 'contents') {
      const client = await pool.connect();
      
      try {
        const { chapter, section } = event.queryStringParameters || {};
        
        let query = `
          SELECT c.*, ch.title_arabic, ch.title_indonesian 
          FROM contents c 
          LEFT JOIN chapters ch ON c.chapter_id = ch.id 
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (chapter) {
          paramCount++;
          query += ` AND c.chapter_id = $${paramCount}`;
          params.push(parseInt(chapter));
        }

        if (section) {
          paramCount++;
          query += ` AND c.section = $${paramCount}`;
          params.push(section);
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await client.query(query, params);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      } finally {
        client.release();
      }
    }

    if (event.httpMethod === 'POST' && segments[0] === 'contents') {
      const client = await pool.connect();
      
      try {
        const content = JSON.parse(event.body);
        
        const result = await client.query(
          `INSERT INTO contents (
            chapter_id, section, title, description, 
            file_names, file_types, file_sizes, file_contents, file_datas, file_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            content.chapter,
            content.section,
            content.title,
            content.description || '',
            content.fileNames || [],
            content.fileTypes || [],
            content.fileSizes || [],
            content.fileContents || [],
            content.fileDatas || [],
            content.fileCount || 0
          ]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      } finally {
        client.release();
      }
    }

    if (event.httpMethod === 'DELETE' && segments[0] === 'contents' && segments[1]) {
      const client = await pool.connect();
      
      try {
        const contentId = segments[1];
        
        const result = await client.query('DELETE FROM contents WHERE id = $1', [contentId]);

        if (result.rowCount === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Content not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Content deleted successfully' })
        };
      } finally {
        client.release();
      }
    }

    // Quiz results endpoints
    if (event.httpMethod === 'POST' && segments[0] === 'quiz-results') {
      const client = await pool.connect();
      
      try {
        const quizResult = JSON.parse(event.body);
        
        const result = await client.query(
          `INSERT INTO quiz_results (
            student_id, chapter_id, section, score, total_questions, percentage, answers
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            quizResult.studentId,
            quizResult.chapterId,
            quizResult.section,
            quizResult.score,
            quizResult.totalQuestions,
            quizResult.percentage,
            JSON.stringify(quizResult.answers)
          ]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      } finally {
        client.release();
      }
    }

    // Get students list
    if (event.httpMethod === 'GET' && segments[0] === 'students') {
      const client = await pool.connect();
      
      try {
        const result = await client.query('SELECT * FROM students ORDER BY name ASC');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      } finally {
        client.release();
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found', path: path })
    };

  } catch (error) {
    console.error('Database function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
