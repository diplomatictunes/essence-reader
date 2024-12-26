const request = require('supertest');
const { expect } = require('chai');

const API_URL = 'http://localhost:5173';

describe('API Endpoints', () => {
  it('GET /api/books - should return all books', async () => {
    const res = await request(API_URL).get('/api/books');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('POST /api/books - should create a new book', async () => {
    const newBook = { title: 'Test Book', author: 'Test Author' };
    const res = await request(API_URL).post('/api/books').send(newBook);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
  });

  it('DELETE /api/books/:id - should delete a book', async () => {
    const res = await request(API_URL).delete('/api/books/1');
    expect(res.status).to.equal(204);
  });
});
