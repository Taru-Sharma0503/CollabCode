const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/User');
const Session = require('../models/Session');

describe('Phase 1 — Foundation & Authentication Integration Tests', () => {
  before(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Session.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
    await disconnectDatabase();
  });

  const testUser = {
    name: 'Taru Sharma',
    email: 'taru@example.com',
    password: 'StrongPassword123!',
    confirmPassword: 'StrongPassword123!'
  };

  let accessToken = '';
  let refreshTokenCookie = '';
  let userId = '';

  test('POST /api/v1/auth/register - Successfully registers user and returns envelope', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.user);
    assert.strictEqual(res.body.data.user.name, 'Taru Sharma');
    assert.strictEqual(res.body.data.user.email, 'taru@example.com');
    assert.ok(res.body.data.user.id);
    assert.strictEqual(res.body.data.user.passwordHash, undefined);
    assert.ok(res.body.data.accessToken);

    userId = res.body.data.user.id;
    accessToken = res.body.data.accessToken;

    // Check refresh cookie
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Set-Cookie header should be present');
    refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
    assert.ok(refreshTokenCookie, 'refreshToken cookie should be set');
  });

  test('POST /api/v1/auth/register - Rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'CONFLICT');
  });

  test('POST /api/v1/auth/register - Rejects mismatched passwords with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Password123!',
        confirmPassword: 'MismatchPassword123!'
      });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/auth/login - Successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.strictEqual(res.body.data.user.id, userId);

    accessToken = res.body.data.accessToken;
    const cookies = res.headers['set-cookie'];
    refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
  });

  test('POST /api/v1/auth/login - Rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHENTICATED');
  });

  test('GET /api/v1/auth/me - Retrieves current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.id, userId);
    assert.strictEqual(res.body.data.user.email, testUser.email);
  });

  test('GET /api/v1/auth/me - Rejects request without Bearer token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/auth/refresh - Successfully refreshes access token using cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.accessToken);

    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken;
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
    }
  });

  test('PATCH /api/v1/users/me - Updates user profile name', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Taru S. Updated' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.name, 'Taru S. Updated');
  });

  test('GET /api/v1/users/me/sessions - Lists active sessions', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.sessions));
    assert.ok(res.body.data.sessions.length >= 1);
  });

  test('POST /api/v1/auth/logout - Revokes session and returns 204 No Content', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshTokenCookie);

    assert.strictEqual(res.status, 204);

    // Attempting refresh with revoked token should now fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookie);

    assert.strictEqual(refreshRes.status, 401);
  });
});
