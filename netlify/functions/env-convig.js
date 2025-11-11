// netlify/functions/env-config.js - Environment configuration
class EnvConfig {
  constructor() {
    this.loadEnvironment();
  }

  loadEnvironment() {
    // Untuk production (Netlify), environment variables sudah diset
    // Untuk development, load dari .env file
    if (process.env.NODE_ENV !== 'production') {
      try {
        require('dotenv').config();
        console.log('🔧 Development environment loaded from .env file');
      } catch (error) {
        console.log('🌍 Production environment - using Netlify environment variables');
      }
    }

    this.validateRequired();
  }

  validateRequired() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      console.log('💡 Please set these in Netlify dashboard:');
      console.log('   - DATABASE_URL: Your Neon connection string');
      console.log('   - JWT_SECRET: A secure random string');
      throw new Error(`Missing: ${missing.join(', ')}`);
    }

    console.log('✅ All required environment variables are set');
    console.log('📊 Database:', process.env.DATABASE_URL ? 'Connected' : 'Missing');
    console.log('🔐 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Missing');
  }

  get database() {
    return {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }

  get auth() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      expiresIn: process.env.TOKEN_EXPIRES_IN || '24h'
    };
  }

  get isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}

module.exports = new EnvConfig();
