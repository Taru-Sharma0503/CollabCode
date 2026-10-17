const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const File = require('../models/File');
const Invitation = require('../models/Invitation');

describe('Phase 2 — Workspaces & File Management Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let workspaceId = '';

  before(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Invitation.deleteMany({});

    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Developer Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userAToken = resA.body.data.accessToken;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Developer Bob',
        email: 'bob@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userBToken = resB.body.data.accessToken;
    userBId = resB.body.data.user.id;
  });

  after(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Invitation.deleteMany({});
    await disconnectDatabase();
  });

  test('POST /api/v1/workspaces - User A creates a workspace with javascript template', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Alice Cloud App',
        description: 'Collaborative real-time cloud IDE project',
        template: 'javascript'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.workspace.name, 'Alice Cloud App');
    assert.strictEqual(res.body.data.workspace.role, 'owner');
    assert.strictEqual(res.body.data.workspace.ownerId, userAId);
    workspaceId = res.body.data.workspace.id;
    assert.ok(workspaceId);
  });

  test('GET /api/v1/workspaces/:workspaceId/files - Automatically generated starter files exist', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.items));
    assert.strictEqual(res.body.data.items.length, 3);

    const fileNames = res.body.data.items.map((f) => f.name);
    assert.ok(fileNames.includes('index.js'));
    assert.ok(fileNames.includes('package.json'));
    assert.ok(fileNames.includes('README.md'));
  });

  test('Isolation: User B cannot access User A workspace without membership (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('Isolation: User B cannot access or modify User A files (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  let folderId = '';
  test('POST /api/v1/workspaces/:workspaceId/files - Creates folder and nested file', async () => {
    // 1. Create a folder
    const folderRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'src',
        type: 'folder',
        parentId: null
      });

    assert.strictEqual(folderRes.status, 201);
    assert.strictEqual(folderRes.body.data.file.name, 'src');
    assert.strictEqual(folderRes.body.data.file.type, 'folder');
    folderId = folderRes.body.data.file.id;

    // 2. Create nested file inside folder
    const fileRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'utils.js',
        type: 'file',
        parentId: folderId,
        content: 'export const add = (a, b) => a + b;'
      });

    assert.strictEqual(fileRes.status, 201);
    assert.strictEqual(fileRes.body.data.file.name, 'utils.js');
    assert.strictEqual(fileRes.body.data.file.parentId, folderId);
  });

  test('POST /api/v1/workspaces/:workspaceId/files - Rejects duplicate file name in same folder (409)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'utils.js',
        type: 'file',
        parentId: folderId,
        content: 'duplicate'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'CONFLICT');
  });

  let inviteToken = '';
  test('Invitations: User A invites User B, and User B accepts', async () => {
    const inviteRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/invitations`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        email: 'bob@example.com',
        role: 'member'
      });

    assert.strictEqual(inviteRes.status, 201);
    assert.ok(inviteRes.body.data.invitation.token);
    inviteToken = inviteRes.body.data.invitation.token;

    // User B accepts invitation
    const acceptRes = await request(app)
      .post(`/api/v1/invitations/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.data.workspace.id, workspaceId);

    // User B can now access workspace
    const wsRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(wsRes.status, 200);
    assert.strictEqual(wsRes.body.data.workspace.role, 'member');
  });

  test('DELETE /api/v1/workspaces/:workspaceId/files/:fileId - Recursive folder deletion deletes children', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/files/${folderId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(deleteRes.status, 204);

    // Verify folder and nested file are gone
    const listRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`);

    const names = listRes.body.data.items.map((i) => i.name);
    assert.ok(!names.includes('src'));
    assert.ok(!names.includes('utils.js'));
  });
});
