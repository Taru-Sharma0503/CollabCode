const crypto = require('crypto');
const Workspace = require('../../models/Workspace');
const Membership = require('../../models/Membership');
const Invitation = require('../../models/Invitation');
const File = require('../../models/File');
const User = require('../../models/User');
const { ROLES, TEMPLATES, FILE_TYPES, ERROR_CODES } = require('../../../../shared/contracts/constants');
const { AppError } = require('../../middleware/errorHandler');
const { hashToken } = require('../../utils/token');

class WorkspacesService {
  async createWorkspace(userId, { name, description = '', template = TEMPLATES.JAVASCRIPT }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('Workspace name is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: (description || '').trim(),
      ownerId: userId,
      version: 1
    });

    // Create owner membership
    await Membership.create({
      workspaceId: workspace._id,
      userId,
      role: ROLES.OWNER
    });

    // Generate starter files according to template
    await this.generateStarterFiles(workspace._id, template);

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId.toString(),
      role: ROLES.OWNER,
      memberCount: 1,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  async generateStarterFiles(workspaceId, template) {
    if (template === TEMPLATES.HTML_CSS_JS) {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CollabCode Web App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Hello from CollabCode!</h1>
    <p>Real-time collaborative editing in action.</p>
    <button id="counterBtn">Clicks: 0</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

      const cssContent = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #101827;
  color: #F1F5F9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.container {
  text-align: center;
  padding: 2rem;
  background: #182438;
  border-radius: 10px;
  border: 1px solid #334155;
}

button {
  background: #6C8CFF;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}`;

      const jsContent = `let count = 0;
const btn = document.getElementById('counterBtn');

btn.addEventListener('click', () => {
  count++;
  btn.textContent = \`Clicks: \${count}\`;
});

console.log('App initialized successfully!');`;

      await File.create([
        { workspaceId, name: 'index.html', type: FILE_TYPES.FILE, language: 'html', content: htmlContent, size: Buffer.byteLength(htmlContent) },
        { workspaceId, name: 'styles.css', type: FILE_TYPES.FILE, language: 'css', content: cssContent, size: Buffer.byteLength(cssContent) },
        { workspaceId, name: 'script.js', type: FILE_TYPES.FILE, language: 'javascript', content: jsContent, size: Buffer.byteLength(jsContent) }
      ]);
    } else if (template === TEMPLATES.JAVASCRIPT) {
      const jsContent = `// CollabCode JavaScript Workspace
function greet(name) {
  return \`Welcome to CollabCode, \${name}! Ready to build together.\`;
}

console.log(greet('Developer'));

// Calculate Fibonacci sequence
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));`;

      const pkgContent = `{
  "name": "collabcode-project",
  "version": "1.0.0",
  "description": "Collaborative project powered by CollabCode",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}`;

      const readmeContent = `# CollabCode Project
Welcome to your real-time collaborative workspace.
- Edit code together with your team
- Live cursors, document synchronization and chat
- Create revisions and restore at any checkpoint
`;

      await File.create([
        { workspaceId, name: 'index.js', type: FILE_TYPES.FILE, language: 'javascript', content: jsContent, size: Buffer.byteLength(jsContent) },
        { workspaceId, name: 'package.json', type: FILE_TYPES.FILE, language: 'json', content: pkgContent, size: Buffer.byteLength(pkgContent) },
        { workspaceId, name: 'README.md', type: FILE_TYPES.FILE, language: 'markdown', content: readmeContent, size: Buffer.byteLength(readmeContent) }
      ]);
    } else {
      // Blank template
      const jsContent = `// Blank workspace starter
console.log('Hello, CollabCode!');
`;
      await File.create([
        { workspaceId, name: 'main.js', type: FILE_TYPES.FILE, language: 'javascript', content: jsContent, size: Buffer.byteLength(jsContent) }
      ]);
    }
  }

  async listWorkspaces(userId, { page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const memberships = await Membership.find({ userId });
    const workspaceIds = memberships.map((m) => m.workspaceId);

    const total = await Workspace.countDocuments({ _id: { $in: workspaceIds } });
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(take);

    // Compute member counts and roles
    const memberCounts = await Membership.aggregate([
      { $match: { workspaceId: { $in: workspaceIds } } },
      { $group: { _id: '$workspaceId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map();
    memberCounts.forEach((mc) => countMap.set(mc._id.toString(), mc.count));

    const roleMap = new Map();
    memberships.forEach((m) => roleMap.set(m.workspaceId.toString(), m.role));

    const items = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      description: ws.description,
      ownerId: ws.ownerId.toString(),
      role: roleMap.get(ws.id) || ROLES.MEMBER,
      memberCount: countMap.get(ws.id) || 1,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt
    }));

    return {
      items,
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async getWorkspace(workspaceId, userId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const membership = await Membership.findOne({ workspaceId, userId });
    if (!membership) {
      throw new AppError('You do not have access to this workspace.', 403, ERROR_CODES.UNAUTHORIZED);
    }

    const memberCount = await Membership.countDocuments({ workspaceId });

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId.toString(),
      role: membership.role,
      memberCount,
      version: workspace.version,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  async updateWorkspace(workspaceId, { name, description }) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('Workspace name cannot be empty.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      workspace.name = name.trim();
    }

    if (description !== undefined) {
      workspace.description = description.trim();
    }

    await workspace.save();

    const memberCount = await Membership.countDocuments({ workspaceId });

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId.toString(),
      memberCount,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  async deleteWorkspace(workspaceId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    // Cascade delete all associated collections
    await Promise.all([
      Workspace.deleteOne({ _id: workspaceId }),
      Membership.deleteMany({ workspaceId }),
      Invitation.deleteMany({ workspaceId }),
      File.deleteMany({ workspaceId })
    ]);

    return true;
  }

  async getMembers(workspaceId) {
    const memberships = await Membership.find({ workspaceId }).sort({ createdAt: 1 });
    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } });

    const userMap = new Map();
    users.forEach((u) => userMap.set(u.id, u.toSafeObject()));

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId.toString(),
      user: userMap.get(m.userId.toString()) || null,
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  async inviteMember(workspaceId, inviterUserId, { email, role = ROLES.MEMBER }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Valid email address is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const alreadyMember = await Membership.findOne({ workspaceId, userId: existingUser._id });
      if (alreadyMember) {
        throw new AppError('This user is already a member of the workspace.', 409, ERROR_CODES.CONFLICT);
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      expiresAt,
      status: 'pending'
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token, // Return plain token for sharing or link generation
      expiresAt: invitation.expiresAt
    };
  }

  async acceptInvitation(token, userId) {
    const hashed = hashToken(token);
    const invitation = await Invitation.findOne({
      tokenHash: hashed,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      throw new AppError('Invalid or expired invitation token.', 404, ERROR_CODES.NOT_FOUND);
    }

    const workspace = await Workspace.findById(invitation.workspaceId);
    if (!workspace) {
      throw new AppError('Workspace no longer exists.', 404, ERROR_CODES.NOT_FOUND);
    }

    // Add or update membership
    await Membership.findOneAndUpdate(
      { workspaceId: invitation.workspaceId, userId },
      { role: invitation.role },
      { upsert: true, new: true }
    );

    invitation.status = 'accepted';
    await invitation.save();

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description
    };
  }

  async updateMemberRole(workspaceId, targetUserId, newRole, requesterId) {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new AppError('Invalid role specified.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (workspace.ownerId.toString() === targetUserId && newRole !== ROLES.OWNER) {
      throw new AppError('Cannot demote the workspace owner.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const member = await Membership.findOne({ workspaceId, userId: targetUserId });
    if (!member) {
      throw new AppError('Member not found in this workspace.', 404, ERROR_CODES.NOT_FOUND);
    }

    member.role = newRole;
    await member.save();

    return {
      id: member.id,
      userId: member.userId.toString(),
      role: member.role
    };
  }

  async removeMember(workspaceId, targetUserId, requesterId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (workspace.ownerId.toString() === targetUserId) {
      throw new AppError('Cannot remove the workspace owner.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const deleted = await Membership.findOneAndDelete({ workspaceId, userId: targetUserId });
    if (!deleted) {
      throw new AppError('Member not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    return true;
  }
}

module.exports = new WorkspacesService();
