const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, 'sessions.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

// Create sessions table
db.serialize(() => {
  // Users table for both Microsoft Entra ID and local authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      password TEXT,
      tenant_id TEXT,
      roles TEXT DEFAULT '["user"]',
      is_active BOOLEAN DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User sessions table for refresh tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('question', 'answer')),
      timestamp TEXT NOT NULL,
      model TEXT NOT NULL,
      question_provider TEXT,
      question_model TEXT,
      answer_provider TEXT,
      answer_model TEXT,
      blog_content TEXT,
      blog_url TEXT,
      total_input_tokens INTEGER DEFAULT 0,
      total_output_tokens INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Session statistics table
  db.run(`
    CREATE TABLE IF NOT EXISTS session_statistics (
      session_id TEXT PRIMARY KEY,
      total_questions INTEGER DEFAULT 0,
      avg_accuracy TEXT DEFAULT '',
      total_cost TEXT DEFAULT '0',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // QA data table
  db.run(`
    CREATE TABLE IF NOT EXISTS qa_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      accuracy TEXT DEFAULT '',
      sentiment TEXT DEFAULT '',
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      question_order INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_qa_data_session_id ON qa_data(session_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token)`);

  console.log('Database tables created successfully!');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
}); 