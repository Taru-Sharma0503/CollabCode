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
const Revision = require('../models/Revision');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const { SOCKET_EVENTS } = require('../../../shared/contracts/socketEvents');

describe('Phase 4 — Collaboration Features (Revisions, Comments, Chat) Integration Tests', () => {
  let server;
  let serverPort;
  let userToken = '';
  let userId = '';
  let workspaceId = '';
  let fileId = '';
  let socket;

  before(async () => {
    await connectDatabase();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await File.deleteMany({});
    await Revision.deleteMany({});
    await Comment.deleteMany({});
    await Message.deleteMany({});

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
        name: 'Reviewer Ray',
        email: 'ray@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userToken = resUser.body.data.accessToken;
    userId = resUser.body.data.user.id;

    const resWs = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Feature Review Workspace',
        template: 'blank'
      });
    workspaceId = resWs.body.data.workspace.id;

    const resFile = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/files`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'app.js',
        content: 'const v = 1;\nconsole.log(v);'
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
    await Revision.deleteMany({});
    await Comment.deleteMany({});
    await Message.deleteMany({});
    await disconnectDatabase();
  });

  let rev1Id = '';
  let rev2Id = '';

  test('POST /api/v1/workspaces/:workspaceId/revisions - Creates snapshot revisions', async () => {
    // Revision 1
    const res1 = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/revisions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'Initial version 1' });

    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.data.revision.message, 'Initial version 1');
    rev1Id = res1.body.data.revision.id;

    // Modify file
    await File.updateOne({ _id: fileId }, { content: 'const v = 2;\nconsole.log(v + 1);' });

    // Revision 2
    const res2 = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/revisions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'Upgraded version 2' });

    assert.strictEqual(res2.status, 201);
    rev2Id = res2.body.data.revision.id;
  });

  test('GET /api/v1/workspaces/:workspaceId/revisions/compare - Generates file diff between revisions', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/revisions/compare?from=${rev1Id}&to=${rev2Id}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.files));

    const appJsDiff = res.body.data.files.find((f) => f.name === 'app.js');
    assert.ok(appJsDiff);
    assert.strictEqual(appJsDiff.status, 'modified');
    assert.strictEqual(appJsDiff.oldContent, 'const v = 1;\nconsole.log(v);');
    assert.strictEqual(appJsDiff.newContent, 'const v = 2;\nconsole.log(v + 1);');
  });

  test('POST /api/v1/workspaces/:workspaceId/revisions/:revisionId/restore - Restores state safely', async () => {
    const ws = await Workspace.findById(workspaceId);

    // Restore rev1
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/revisions/${rev1Id}/restore`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ expectedVersion: ws.version });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Verify restored file content
    const restoredFile = await File.findOne({ workspaceId, name: 'app.js' });
    assert.strictEqual(restoredFile.content, 'const v = 1;\nconsole.log(v);');
    fileId = restoredFile.id;
  });

  let commentId = '';
  test('Comments API: Create, reply, resolve, and list comments', async () => {
    // 1. Create comment
    const createRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileId,
        body: 'Consider extracting this constant into config.',
        anchor: { start: 0, end: 11 }
      });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.data.comment.status, 'open');
    commentId = createRes.body.data.comment.id;

    // 2. Add reply
    const replyRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ body: 'Good catch, will do!' });

    assert.strictEqual(replyRes.status, 201);
    assert.strictEqual(replyRes.body.data.reply.body, 'Good catch, will do!');

    // 3. Resolve comment
    const resolveRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/comments/${commentId}/resolve`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.data.comment.status, 'resolved');

    // 4. List comments
    const listRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/comments`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.items.length, 1);
    assert.strictEqual(listRes.body.data.items[0].replies.length, 1);
  });

  test('Workspace Chat: Send message over socket and retrieve via REST', async () => {
    const sendAck = await new Promise((resolve) => {
      socket.emit(
        SOCKET_EVENTS.CHAT_SEND,
        {
          workspaceId,
          clientMessageId: 'cli_msg_1',
          body: 'Hello team, the new revision has been committed!'
        },
        resolve
      );
    });

    assert.strictEqual(sendAck.ok, true);
    assert.strictEqual(sendAck.message.body, 'Hello team, the new revision has been committed!');

    // Retrieve through REST endpoint
    const restRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/messages`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(restRes.status, 200);
    assert.ok(Array.isArray(restRes.body.data.items));
    assert.strictEqual(restRes.body.data.items.length, 1);
    assert.strictEqual(restRes.body.data.items[0].body, 'Hello team, the new revision has been committed!');
  });
});
