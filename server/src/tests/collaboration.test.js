process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const request = require('supertest');
const ioClient = require('socket.io-client');
const Y = require('yjs');
const app = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { createSocketServer } = require('../config/socket');
const { initSocketIO } = require('../socket');
const documentManager = require('../collaboration/documentManager');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const File = require('../models/File');
const Invitation = require('../models/Invitation');
const { SOCKET_EVENTS } = require('../../../shared/contracts/socketEvents');

describe('Phase 3 — Real-Time Collaboration & Yjs Synchronization Integration Tests', () => {
  let server;
  let serverPort;
  let userAToken = '';
  let userBToken = '';
  let workspaceId = '';
  let fileId = '';
  let socketA;
  let socketB;

  before(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Invitation.deleteMany({});

    // Start server on dynamic port
    server = http.createServer(app);
    const io = createSocketServer(server);
    initSocketIO(io);
    app.set('io', io);

    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });

    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alice Collab',
        email: 'alice.collab@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userAToken = resA.body.data.accessToken;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bob Collab',
        email: 'bob.collab@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userBToken = resB.body.data.accessToken;

    // Create workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Collaboration Room',
        template: 'blank'
      });
    workspaceId = wsRes.body.data.workspace.id;

    // Create a shared test file
    const fileRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'shared.js',
        type: 'file',
        content: 'console.log("Start");'
      });
    fileId = fileRes.body.data.file.id;

    // Invite User B and accept
    const inviteRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/invitations`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'bob.collab@example.com', role: 'member' });

    await request(app)
      .post(`/api/v1/invitations/${inviteRes.body.data.invitation.token}/accept`)
      .set('Authorization', `Bearer ${userBToken}`);
  });

  after(async () => {
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    await new Promise((resolve) => server.close(resolve));
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await disconnectDatabase();
  });

  test('Both clients authenticate and join workspace room with live presence', async () => {
    socketA = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: userAToken },
      transports: ['websocket']
    });

    socketB = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: userBToken },
      transports: ['websocket']
    });

    // Wait for connection
    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res))
    ]);

    assert.ok(socketA.connected);
    assert.ok(socketB.connected);

    // Join workspace
    const joinA = await new Promise((resolve) => {
      socketA.emit(SOCKET_EVENTS.WORKSPACE_JOIN, { workspaceId }, resolve);
    });

    const joinB = await new Promise((resolve) => {
      socketB.emit(SOCKET_EVENTS.WORKSPACE_JOIN, { workspaceId }, resolve);
    });

    assert.strictEqual(joinA.ok, true);
    assert.strictEqual(joinB.ok, true);
    assert.strictEqual(joinA.workspace.id, workspaceId);
  });

  test('Concurrent edits on Yjs document converge perfectly on both clients and server', async () => {
    // 1. Both clients join document room and receive initial state
    const joinDocA = await new Promise((resolve) => {
      socketA.emit(SOCKET_EVENTS.DOCUMENT_JOIN, { workspaceId, fileId }, resolve);
    });
    const joinDocB = await new Promise((resolve) => {
      socketB.emit(SOCKET_EVENTS.DOCUMENT_JOIN, { workspaceId, fileId }, resolve);
    });

    assert.strictEqual(joinDocA.ok, true);
    assert.strictEqual(joinDocB.ok, true);

    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Apply initial server states
    const initUpdateA = Buffer.from(joinDocA.initialUpdate, 'base64');
    const initUpdateB = Buffer.from(joinDocB.initialUpdate, 'base64');
    Y.applyUpdate(docA, initUpdateA);
    Y.applyUpdate(docB, initUpdateB);

    const textA = docA.getText('monaco');
    const textB = docB.getText('monaco');

    assert.strictEqual(textA.toString(), 'console.log("Start");');
    assert.strictEqual(textB.toString(), 'console.log("Start");');

    // Setup sync listening
    docA.on('update', (update, origin) => {
      if (origin !== 'remote') {
        socketA.emit(SOCKET_EVENTS.DOCUMENT_SYNC, {
          workspaceId,
          fileId,
          update: Buffer.from(update).toString('base64')
        });
      }
    });

    docB.on('update', (update, origin) => {
      if (origin !== 'remote') {
        socketB.emit(SOCKET_EVENTS.DOCUMENT_SYNC, {
          workspaceId,
          fileId,
          update: Buffer.from(update).toString('base64')
        });
      }
    });

    const updateReceivedByB = new Promise((resolve) => {
      socketB.on(SOCKET_EVENTS.DOCUMENT_SYNC, (data) => {
        if (data.fileId === fileId) {
          const buf = Buffer.from(data.update, 'base64');
          Y.applyUpdate(docB, buf, 'remote');
          resolve();
        }
      });
    });

    const updateReceivedByA = new Promise((resolve) => {
      socketA.on(SOCKET_EVENTS.DOCUMENT_SYNC, (data) => {
        if (data.fileId === fileId) {
          const buf = Buffer.from(data.update, 'base64');
          Y.applyUpdate(docA, buf, 'remote');
          resolve();
        }
      });
    });

    // Concurrent edits:
    // Alice inserts at the beginning: '// Alice header\n'
    textA.insert(0, '// Alice header\n');

    // Bob appends at the end: '\n// Bob footer'
    textB.insert(textB.length, '\n// Bob footer');

    // Wait for both updates to be received and applied
    await Promise.all([updateReceivedByA, updateReceivedByB]);

    // Check CRDT convergence
    assert.strictEqual(textA.toString(), textB.toString());
    assert.ok(textA.toString().includes('// Alice header\n'));
    assert.ok(textA.toString().includes('// Bob footer'));

    // Check that server in-memory document also matches
    const serverDoc = await documentManager.getOrCreateDoc(workspaceId, fileId);
    assert.strictEqual(serverDoc.getText('monaco').toString(), textA.toString());

    // Flush and verify persistence to MongoDB
    await documentManager.flushAll();
    const persistedFile = await File.findById(fileId);
    assert.strictEqual(persistedFile.content, textA.toString());
  });
});
