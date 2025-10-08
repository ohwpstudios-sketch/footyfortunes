-- schema.sql - Complete Database Schema for FootyFortunes
-- Run this with: wrangler d1 execute footyfortunes_db --file=./schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  last_login TEXT
);

-- Picks table
CREATE TABLE IF NOT EXISTS picks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  combined_odds REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'won', 'lost')),
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pick_id TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kick_off_time TEXT NOT NULL,
  selection_type TEXT NOT NULL,
  odds REAL NOT NULL,
  confidence INTEGER NOT NULL CHECK(confidence >= 0 AND confidence <= 100),
  fixture_id INTEGER,
  result TEXT CHECK(result IN ('won', 'lost', 'pending', NULL)),
  final_score TEXT,
  FOREIGN KEY (pick_id) REFERENCES picks(id) ON DELETE CASCADE
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  preferences TEXT NOT NULL,
  subscribed_at TEXT NOT NULL,
  unsubscribed_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_picks_date ON picks(date);
CREATE INDEX IF NOT EXISTS idx_picks_status ON picks(status);
CREATE INDEX IF NOT EXISTS idx_matches_pick_id ON matches(pick_id);
CREATE INDEX IF NOT EXISTS idx_matches_fixture_id ON matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create default admin user (password: admin123 - CHANGE THIS!)
INSERT OR IGNORE INTO users (email, password_hash, role, status, created_at) 
VALUES ('mydaily2plusodds@gmail.com', 'angels2G9@84?', 'admin', 'active', datetime('now'));

-- Sample data for testing (optional)
INSERT OR IGNORE INTO picks (id, date, combined_odds, status, created_at)
VALUES ('pick_sample_1', date('now'), 3.2, 'pending', datetime('now'));

INSERT OR IGNORE INTO matches (pick_id, league, home_team, away_team, kick_off_time, selection_type, odds, confidence)
VALUES 
  ('pick_sample_1', 'Premier League', 'Arsenal', 'Chelsea', '20:00', 'Home Win', 1.65, 85),
  ('pick_sample_1', 'La Liga', 'Barcelona', 'Real Madrid', '21:00', 'Over 2.5', 1.75, 78),
  ('pick_sample_1', 'Bundesliga', 'Bayern Munich', 'Dortmund', '18:30', 'BTTS', 1.55, 82);