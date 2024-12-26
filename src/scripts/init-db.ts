import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Resolve the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct database path resolution
const dbPath = path.resolve(__dirname, '../../data/books.db');
console.log('Initialized database at:', dbPath);

// Initialize the database
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metadata TEXT,
    content BLOB
);
`);

console.log('Database initialized.');
db.close();
