process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const request = require('supertest');
const ioClient = require('socket.io-client');
const app = require('../app');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { createSocketServer } = require('../config/socket');
const { initSocketIO } = require('../socket');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const File = require('../models/File');
const Execution = require('../models/Execution');
const { SOCKET_EVENTS } = require('../../../shared/contracts/socketEvents');

describe('Phase 6 — Code Execution API & Streaming Integration Tests', () => {
  let server;
  let serverPort;
  let userToken = '';
  let workspaceId = '';
  let fileId = '';
  let socket;

  before(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Execution.deleteMany({});

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

    const resUser = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Exec Tester',
        email: 'exec@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userToken = resUser.body.data.accessToken;

    const resWs = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Execution Sandbox',
        template: 'blank'
      });
    workspaceId = resWs.body.data.workspace.id;

    const resFile = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'script.js',
        language: 'javascript',
        content: 'console.log("CollabCode Execution Success!");'
      });
    fileId = resFile.body.data.file.id;

    socket = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: userToken },
      transports: ['websocket']
    });

    await new Promise((res) => socket.on('connect', res));
    await new Promise((resolve) => {
      socket.emit(SOCKET_EVENTS.WORKSPACE_JOIN, { workspaceId }, resolve);
    });
  });

  after(async () => {
    if (socket) socket.disconnect();
    await new Promise((resolve) => server.close(resolve));
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Execution.deleteMany({});
    await disconnectDatabase();
  });

  let executionId = '';

  test('POST /api/v1/workspaces/:workspaceId/executions - Accepts execution job with 202', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/executions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileId,
        language: 'javascript',
        stdin: ''
      });

    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.execution.status, 'queued');
    assert.strictEqual(res.body.data.execution.language, 'javascript');
    executionId = res.body.data.execution.id;
    assert.ok(executionId);
  });

  test('Real-time streaming: Output and completion status received over socket', async () => {
    let outputReceived = '';
    const statusPromise = new Promise((resolve) => {
      socket.on(SOCKET_EVENTS.EXECUTION_OUTPUT, (data) => {
        if (data.executionId === executionId) {
          outputReceived += data.chunk;
        }
      });

      socket.on(SOCKET_EVENTS.EXECUTION_STATUS, (data) => {
        if (data.executionId === executionId && (data.status === 'completed' || data.status === 'failed')) {
          resolve(data);
        }
      });
    });

    const statusData = await statusPromise;
    assert.strictEqual(statusData.status, 'completed');
    assert.ok(outputReceived.includes('CollabCode Execution Success!'));
  });

  test('GET /api/v1/workspaces/:workspaceId/executions/:executionId - Retrieves completed execution result', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/executions/${executionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.execution.status, 'completed');
    assert.strictEqual(res.body.data.execution.exitCode, 0);
    assert.ok(res.body.data.execution.stdout.includes('CollabCode Execution Success!'));
  });

  test('POST /api/v1/workspaces/:workspaceId/executions - Rejects unsupported languages with 422', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/executions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileId,
        language: 'cobol'
      });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/workspaces/:workspaceId/executions/:executionId/cancel - Cancels active process', async () => {
    // Create infinite loop file
    const loopFile = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'loop.js',
        content: 'while(true) {}'
      });

    const submitRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/executions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileId: loopFile.body.data.file.id,
        language: 'javascript'
      });

    const loopExecId = submitRes.body.data.execution.id;

    // Small delay then cancel
    await new Promise((r) => setTimeout(r, 100));

    const cancelRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/executions/${loopExecId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.execution.status, 'cancelled');
  });
});
