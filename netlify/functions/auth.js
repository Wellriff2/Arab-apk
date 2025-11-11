import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Mock teacher data (dalam production, ambil dari database)
const teachers = [
  {
    id: '1',
    username: 'guru',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // guru123
    name: 'Guru Bahasa Arab'
  }
];

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { username, password } = JSON.parse(event.body);

      // Find teacher
      const teacher = teachers.find(t => t.username === username);
      
      if (!teacher) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Verify password (dalam production, gunakan bcrypt.compare)
      const isValidPassword = await bcrypt.compare(password, teacher.password);

      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: teacher.id, 
          username: teacher.username,
          role: 'teacher'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            username: teacher.username
          }
        })
      };

    } catch (error) {
      console.error('Auth error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
