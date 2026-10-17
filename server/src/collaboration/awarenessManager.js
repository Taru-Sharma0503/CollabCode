const { PRESENCE_STATUS } = require('../../../shared/contracts/constants');

class AwarenessManager {
  constructor() {
    // workspaceId -> Map(userId -> { userId, name, status, activeFileId, cursor, sockets: Set() })
    this.workspacePresence = new Map();
  }

  setPresence(workspaceId, user, { status = PRESENCE_STATUS.ACTIVE, activeFileId = null, cursor = null, socketId }) {
    if (!this.workspacePresence.has(workspaceId)) {
      this.workspacePresence.set(workspaceId, new Map());
    }

    const presenceMap = this.workspacePresence.get(workspaceId);
    let userEntry = presenceMap.get(user.id);

    if (!userEntry) {
      userEntry = {
        userId: user.id,
        name: user.name,
        status,
        activeFileId,
        cursor,
        sockets: new Set([socketId])
      };
      presenceMap.set(user.id, userEntry);
    } else {
      userEntry.status = status;
      userEntry.activeFileId = activeFileId !== undefined ? activeFileId : userEntry.activeFileId;
      if (cursor !== undefined) userEntry.cursor = cursor;
      userEntry.sockets.add(socketId);
    }

    return this.formatPresence(userEntry);
  }

  getWorkspacePresence(workspaceId) {
    const presenceMap = this.workspacePresence.get(workspaceId);
    if (!presenceMap) return [];
    return Array.from(presenceMap.values()).map((p) => this.formatPresence(p));
  }

  removeSocket(workspaceId, userId, socketId) {
    const presenceMap = this.workspacePresence.get(workspaceId);
    if (!presenceMap) return null;

    const userEntry = presenceMap.get(userId);
    if (!userEntry) return null;

    userEntry.sockets.delete(socketId);

    if (userEntry.sockets.size === 0) {
      presenceMap.delete(userId);
      return {
        userId,
        name: userEntry.name,
        status: 'offline',
        activeFileId: null
      };
    }

    return null;
  }

  removeSocketFromAll(socketId, userId) {
    const removedFrom = [];
    for (const [workspaceId, presenceMap] of this.workspacePresence.entries()) {
      if (presenceMap.has(userId)) {
        const offlineEntry = this.removeSocket(workspaceId, userId, socketId);
        if (offlineEntry) {
          removedFrom.push({ workspaceId, presence: offlineEntry });
        }
      }
    }
    return removedFrom;
  }

  formatPresence(entry) {
    return {
      userId: entry.userId,
      name: entry.name,
      status: entry.status,
      activeFileId: entry.activeFileId,
      cursor: entry.cursor || null
    };
  }
}

module.exports = new AwarenessManager();
