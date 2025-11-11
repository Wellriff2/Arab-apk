// netlify/functions/database.js
const { Pool } = require('pg');

// Load environment configuration
let envConfig;
try {
  envConfig = require('./env-config');
} catch (error) {
  console.error('❌ Failed to load env-config:', error.message);
  // Fallback langsung ke process.env
  envConfig = {
    database: {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    isProduction: process.env.NODE_ENV === 'production'
  };
}

console.log('🔧 Database URL:', envConfig.database.url ? 'Set' : 'Not set');

const pool = new Pool({
  connectionString: envConfig.database.url,
  ssl: envConfig.database.ssl
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully to Neon'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Check DATABASE_URL in Netlify environment variables');
  });

exports.handler = async (event, context) => {
  console.log('🚀 Database function called:', event.httpMethod, event.path);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check if database is configured
  if (!envConfig.database.url) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database not configured',
        message: 'DATABASE_URL environment variable is missing. Please set it in Netlify dashboard.',
        solution: 'Go to Netlify Site Settings > Environment Variables > Add DATABASE_URL'
      })
    };
  }

  const path = event.path.replace('/.netlify/functions/database', '');
  const segments = path.split('/').filter(segment => segment);

  try {
    // Get all data endpoint
    if (event.httpMethod === 'GET' && (!segments[0] || segments[0] === 'data')) {
      const client = await pool.connect();
      try {
        const [studentsResult, contentsResult, quizResults] = await Promise.all([
          client.query('SELECT * FROM students ORDER BY created_at DESC'),
          client.query(`
            SELECT c.*, ch.title_arabic, ch.title_indonesian 
            FROM contents c 
            LEFT JOIN chapters ch ON c.chapter_id = ch.id 
            ORDER BY c.created_at DESC
          `),
          client.query('SELECT * FROM quiz_results ORDER BY completed_at DESC')
        ]);

        const data = {
          students: studentsResult.rows,
          contents: contentsResult.rows,
          quizResults: quizResults.rows
        };

        console.log('📊 Data retrieved:', {
          students: data.students.length,
          contents: data.contents.length,
          quizResults: data.quizResults.length
        });

        return { statusCode: 200, headers, body: JSON.stringify(data) };
      } finally {
        client.release();
      }
    }

    // Students endpoints
    if (event.httpMethod === 'POST' && segments[0] === 'students') {
      const client = await pool.connect();
      try {
        const { id, name } = JSON.parse(event.body);
        
        const result = await client.query(
          'INSERT INTO students (id, name) VALUES ($1, $2) RETURNING *',
          [id, name]
        );

        console.log('✅ Student created:', result.rows[0]);
        return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
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

        console.log('📚 Contents retrieved:', result.rows.length);
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } finally {
        client.release();
      }
    }

    // Add other endpoints as needed...

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found', path: path })
    };

  } catch (error) {
    console.error('💥 Database function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database error',
        message: error.message,
        database: 'Neon PostgreSQL'
      })
    };
  }
};
