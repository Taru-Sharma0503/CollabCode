const File = require('../../models/File');
const { FILE_TYPES, ERROR_CODES } = require('../../../../shared/contracts/constants');
const { AppError } = require('../../middleware/errorHandler');

class FilesService {
  normalizeParentId(parentId) {
    if (!parentId || parentId === 'null' || parentId === 'undefined') {
      return null;
    }
    return parentId;
  }

  detectLanguage(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'mjs':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'py':
        return 'python';
      default:
        return 'javascript';
    }
  }

  formatFile(file) {
    return {
      id: file.id,
      workspaceId: file.workspaceId.toString(),
      parentId: file.parentId ? file.parentId.toString() : null,
      name: file.name,
      type: file.type,
      language: file.language,
      size: file.size || 0,
      updatedAt: file.updatedAt,
      createdAt: file.createdAt
    };
  }

  async listFiles(workspaceId) {
    const files = await File.find({ workspaceId }).sort({ type: -1, name: 1 });
    return files.map((f) => this.formatFile(f));
  }

  async getFile(workspaceId, fileId) {
    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const formatted = this.formatFile(file);
    formatted.content = file.content || '';
    return formatted;
  }

  async createFile(workspaceId, { name, type = FILE_TYPES.FILE, parentId = null, language, content = '' }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('File name is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const normParentId = this.normalizeParentId(parentId);

    // Validate parent folder if specified
    if (normParentId) {
      const parent = await File.findOne({ _id: normParentId, workspaceId });
      if (!parent) {
        throw new AppError('Parent folder not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      if (parent.type !== FILE_TYPES.FOLDER) {
        throw new AppError('Parent must be a folder.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Check duplicate name in same parent
    const existing = await File.findOne({
      workspaceId,
      parentId: normParentId,
      name: name.trim()
    });

    if (existing) {
      throw new AppError(`An item named "${name.trim()}" already exists in this folder.`, 409, ERROR_CODES.CONFLICT);
    }

    const resolvedLanguage = language || this.detectLanguage(name.trim());
    const size = Buffer.byteLength(content || '', 'utf8');

    const file = await File.create({
      workspaceId,
      parentId: normParentId,
      name: name.trim(),
      type,
      language: type === FILE_TYPES.FOLDER ? undefined : resolvedLanguage,
      size: type === FILE_TYPES.FOLDER ? 0 : size,
      content: type === FILE_TYPES.FOLDER ? '' : (content || '')
    });

    return this.formatFile(file);
  }

  async updateFile(workspaceId, fileId, { name, parentId }) {
    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    let targetParentId = file.parentId;
    if (parentId !== undefined) {
      targetParentId = this.normalizeParentId(parentId);
      if (targetParentId) {
        // Prevent moving into itself
        if (targetParentId === fileId) {
          throw new AppError('Cannot move folder into itself.', 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const parent = await File.findOne({ _id: targetParentId, workspaceId });
        if (!parent || parent.type !== FILE_TYPES.FOLDER) {
          throw new AppError('Target parent folder not found.', 404, ERROR_CODES.NOT_FOUND);
        }
      }
    }

    const targetName = name !== undefined ? name.trim() : file.name;

    // Check duplicate name
    if (targetName !== file.name || targetParentId !== file.parentId) {
      const existing = await File.findOne({
        workspaceId,
        parentId: targetParentId,
        name: targetName,
        _id: { $ne: file._id }
      });

      if (existing) {
        throw new AppError(`An item named "${targetName}" already exists in the target location.`, 409, ERROR_CODES.CONFLICT);
      }
    }

    file.name = targetName;
    file.parentId = targetParentId;
    if (file.type === FILE_TYPES.FILE) {
      file.language = this.detectLanguage(targetName);
    }

    await file.save();
    return this.formatFile(file);
  }

  async deleteFile(workspaceId, fileId) {
    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (file.type === FILE_TYPES.FOLDER) {
      // Recursively gather all descendants
      const idsToDelete = [file._id];
      const findChildren = async (pId) => {
        const children = await File.find({ workspaceId, parentId: pId });
        for (const child of children) {
          idsToDelete.push(child._id);
          if (child.type === FILE_TYPES.FOLDER) {
            await findChildren(child._id);
          }
        }
      };

      await findChildren(file._id);
      await File.deleteMany({ _id: { $in: idsToDelete } });
    } else {
      await File.deleteOne({ _id: file._id });
    }

    return true;
  }

  async duplicateFile(workspaceId, fileId, { name }) {
    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const duplicateName = name && name.trim().length > 0 ? name.trim() : `${file.name}.copy`;

    const existing = await File.findOne({
      workspaceId,
      parentId: file.parentId,
      name: duplicateName
    });

    if (existing) {
      throw new AppError(`An item named "${duplicateName}" already exists.`, 409, ERROR_CODES.CONFLICT);
    }

    const duplicated = await File.create({
      workspaceId,
      parentId: file.parentId,
      name: duplicateName,
      type: file.type,
      language: file.language,
      size: file.size,
      content: file.content
    });

    return this.formatFile(duplicated);
  }
}

module.exports = new FilesService();
