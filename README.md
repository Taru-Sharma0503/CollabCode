# CollabCode 🚀
> Browser-based Collaborative Cloud IDE with Real-Time Yjs CRDT Synchronization, Monaco Editor, Presence Cursors, Revision History, Threaded Comments, and Sandboxed Code Execution.

---

## 🏗️ Architecture Overview

- **Frontend**: React 18, Vite, React Router v7, Monaco Editor, Tailwind CSS, Lucide React, Axios.
- **Real-Time Synchronization**: Yjs CRDT document engine, `y-monaco`, Socket.IO bidirectional websocket transport.
- **Backend**: Node.js, Express, Socket.IO, JWT access tokens with secure HttpOnly refresh token rotation cookies, bcrypt password hashing, Mongoose ODM.
- **Database**: MongoDB (MongoDB Atlas ready with automatic in-memory zero-config fallback for seamless local testing).
- **Execution Engine**: Sandboxed code runner with resource limits (5000ms execution timeout, memory capping), interactive stdin, and live stdout/stderr streaming over Socket.IO.

---

## 📁 Repository Structure

```
CollabCode/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── app/                # App, Router, Providers
│   │   ├── pages/              # Landing, Auth, Dashboard, Workspace, Editor, History, Settings, Profile
│   │   ├── components/         # MonacoEditor, FileExplorer, Presence, Chat, Comments, ExecutionPanel, DiffViewer
│   │   ├── services/           # apiClient, authApi, workspaceApi, fileApi, revisionApi, commentApi, executionApi
│   │   ├── collaboration/      # Socket.IO client, SocketIOYjsProvider
│   │   ├── context/            # AuthContext
│   │   └── styles/             # tokens.css, globals.css
│   └── package.json
│
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/             # env.js, database.js, socket.js
│   │   ├── models/             # User, Session, Workspace, Membership, Invitation, File, Revision, Comment, Message, Execution, DocumentSnapshot
│   │   ├── modules/            # auth, users, workspaces, files, revisions, comments, executions
│   │   ├── middleware/         # authenticate, authorize, errorHandler, requestId, rateLimiter
│   │   ├── socket/             # Socket.IO auth, rooms, workspace/presence/document/chat handlers
│   │   ├── collaboration/      # Yjs documentManager, documentPersistence, awarenessManager
│   │   ├── jobs/               # revisionSnapshots, cleanupExpiredSessions
│   │   └── tests/              # Full integration test suites (Phases 1-6)
│   ├── package.json
│   └── .env.example
│
├── shared/
│   └── contracts/              # apiSchemas.js, socketEvents.js, constants.js
│
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### 2. Environment Configuration
The backend comes pre-configured with default development secrets in `server/.env`.
If using MongoDB Atlas or external services, configure `server/.env`:
```bash
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/collabcode
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32chars!
JWT_ACCESS_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
```

### 3. Run the Backend Server
```bash
npm run server:dev
```
Server runs at `http://localhost:5000` with REST API mounted at `http://localhost:5000/api/v1` and Socket.IO on the same port.

### 4. Run the Frontend Development Server
In a new terminal:
```bash
npm run client:dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Verification & Test Suites

Run the complete automated integration test suite covering all phases (31 tests across 5 test suites):
```bash
npm test
```

### Tested Phases:
- **Phase 1 (Foundation & Auth)**: Registration, validation, duplicate prevention, password hashing, login, token refresh rotation, profile updates, session management, logout revocation.
- **Phase 2 (Workspaces & Files)**: Workspace CRUD, template starters, cross-workspace security isolation, file tree nesting, duplicate rejection, invitations, recursive deletion.
- **Phase 3 (Real-Time Collaboration & CRDTs)**: Multi-client Socket.IO auth, workspace presence, Yjs document synchronization, concurrent conflict-free editing convergence, debounced MongoDB snapshot persistence.
- **Phase 4 (Collaboration Features)**: Versioned snapshot creation, file diff comparison, safe rollback restore with optimistic concurrency version check, threaded comments, and socket chat.
- **Phase 5 (Reliability & Scale)**: Rate limiter middleware, expired session cleanup cron, snapshot flush job.
- **Phase 6 (Code Execution)**: Async execution submission (202 Accepted), real-time stdout/stderr socket streaming, language allowlisting, process cancellation.
