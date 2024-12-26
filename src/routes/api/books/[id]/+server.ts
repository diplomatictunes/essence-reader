import type { RequestHandler } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('./data/books.db');

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const id = parseInt(params.id || '', 10); // Use `|| ''` to ensure type safety
        if (isNaN(id)) {
            return new Response('Invalid book ID', { status: 400 });
        }

        const stmt = db.prepare('DELETE FROM books WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            return new Response('Book not found', { status: 404 });
        }

        return new Response('Book deleted', { status: 200 });
    } catch (error) {
        console.error('Error deleting book:', error);
        return new Response('Failed to delete book', { status: 500 });
    }
};
