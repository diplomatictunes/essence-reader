import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Resolve the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the path to the database
const dbDir = path.resolve(__dirname, '../../../../data');
const dbPath = path.join(dbDir, 'books.db');
console.log('Using database at:', dbPath);

// Ensure the "data" directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created directory: ${dbDir}`);
}

// Initialize the database
console.log('Using database at:', dbPath);
const db = new Database(dbPath);

export const POST = async ({ request }) => {
    try {
        const { meta, book } = await request.json();
        const stmt = db.prepare('INSERT INTO books (metadata, content) VALUES (?, ?)');
        const result = stmt.run(JSON.stringify(meta), Buffer.from(book));
        return new Response(JSON.stringify({ bookID: result.lastInsertRowid }), { status: 201 });
    } catch (error) {
        console.error('Error saving book:', error);
        return new Response('Failed to save book', { status: 500 });
    }
};

export const GET = async () => {
    try {
        const stmt = db.prepare('SELECT id, metadata FROM books');
        const rows = stmt.all() as { id: number; metadata: string }[]; // Explicit type cast

        const allMetas = rows.map((row) => ({
            id: row.id,
            ...JSON.parse(row.metadata),
        }));

        return new Response(JSON.stringify(allMetas), { status: 200 });
    } catch (error) {
        console.error('Error fetching books:', error);
        return new Response('Failed to fetch books', { status: 500 });
    }
};
