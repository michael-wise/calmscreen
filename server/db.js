const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;
let pool, sqlite;

if (isPostgres) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  const Database = require('better-sqlite3');
  sqlite = new Database(path.join(__dirname, 'garden.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
}

function toSqlite(sql) {
  return sql.replace(/\$\d+/g, '?');
}

async function all(sql, params = []) {
  if (isPostgres) {
    const { rows } = await pool.query(sql, params);
    return rows;
  }
  return sqlite.prepare(toSqlite(sql)).all(...params);
}

async function get(sql, params = []) {
  if (isPostgres) {
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  }
  return sqlite.prepare(toSqlite(sql)).get(...params) || null;
}

async function run(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(sql, params);
    return { changes: result.rowCount, rows: result.rows };
  }
  const stmt = sqlite.prepare(toSqlite(sql));
  if (sql.toUpperCase().includes('RETURNING')) {
    const row = stmt.get(...params);
    return { changes: 1, rows: row ? [row] : [] };
  }
  const result = stmt.run(...params);
  return { changes: result.changes, rows: [] };
}

async function init() {
  if (isPostgres) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        youtube_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        channel_name TEXT,
        thumbnail_url TEXT,
        notes TEXT,
        added_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#6366f1'
      );
      CREATE TABLE IF NOT EXISTS video_tags (
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (video_id, tag_id)
      );
    `);
  } else {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youtube_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        channel_name TEXT,
        thumbnail_url TEXT,
        notes TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#6366f1'
      );
      CREATE TABLE IF NOT EXISTS video_tags (
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (video_id, tag_id)
      );
    `);
  }

  const result = await get('SELECT COUNT(*) as count FROM tags');
  if (!result || Number(result.count) === 0) {
    const tags = [
      ['calm', '#93C5FD'],
      ['exciting', '#F87171'],
      ['upbeat', '#FBBF24'],
      ['slow pace', '#6EE7B7'],
      ['educational', '#A78BFA'],
      ['musical', '#F472B6'],
      ['nature', '#34D399'],
      ['animals', '#FB923C'],
      ['classic', '#9CA3AF'],
      ['old animation', '#D1D5DB'],
      ['minimal antagonist', '#86EFAC'],
      ['scary', '#EF4444'],
      ['bedtime', '#818CF8'],
      ['gentle', '#7DD3FC'],
      ['colorful', '#E879F9'],
      ['nursery rhyme', '#FCA5A5'],
      ['storytime', '#C084FC'],
      ['counting', '#2DD4BF'],
      ['alphabet', '#38BDF8'],
      ['shapes & colors', '#FB7185'],
    ];
    for (const [name, color] of tags) {
      await run('INSERT INTO tags (name, color) VALUES ($1, $2) ON CONFLICT DO NOTHING', [name, color]);
    }
  }
}

module.exports = { all, get, run, init };
