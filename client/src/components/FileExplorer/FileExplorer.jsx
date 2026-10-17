import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FilePlus,
  FolderPlus,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export default function FileExplorer({
  files = [],
  activeFileId = null,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile
}) {
  const [openFolders, setOpenFolders] = useState(new Set());
  const [modalType, setModalType] = useState(null); // 'create_file', 'create_folder', 'rename', 'delete'
  const [targetItem, setTargetItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [contextMenuId, setContextMenuId] = useState(null);

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const getFileIcon = (fileName, isFolder, isOpen) => {
    if (isFolder) {
      return isOpen ? <FolderOpen className="w-4 h-4 text-accent" /> : <Folder className="w-4 h-4 text-accent" />;
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-text-muted" />;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (modalType === 'create_file') {
      onCreateFile({
        name: itemName.trim(),
        type: 'file',
        parentId: targetItem ? targetItem.id : null
      });
    } else if (modalType === 'create_folder') {
      onCreateFile({
        name: itemName.trim(),
        type: 'folder',
        parentId: targetItem ? targetItem.id : null
      });
    } else if (modalType === 'rename') {
      onRenameFile(targetItem.id, itemName.trim());
    }

    setModalType(null);
    setItemName('');
    setTargetItem(null);
  };

  const renderTree = (parentId = null, depth = 0) => {
    const items = files.filter((f) => (f.parentId || null) === parentId);

    // Folders first, then files sorted alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return items.map((item) => {
      const isFolder = item.type === 'folder';
      const isOpen = openFolders.has(item.id);
      const isActive = item.id === activeFileId;

      return (
        <div key={item.id} className="select-none">
          <div
            onClick={() => {
              if (isFolder) toggleFolder(item.id);
              else onSelectFile(item);
            }}
            className={`group relative flex items-center justify-between px-2 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
              isActive
                ? 'bg-accent/20 text-white font-medium'
                : 'text-text-muted hover:text-text-main hover:bg-border-hover/50'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <div className="flex items-center space-x-1.5 truncate">
              {isFolder ? (
                isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {getFileIcon(item.name, isFolder, isOpen)}
              <span className="truncate">{item.name}</span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetItem(item);
                  setItemName(item.name);
                  setModalType('rename');
                }}
                title="Rename"
                className="p-1 hover:text-text-main"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              {!isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateFile(item.id, `${item.name}.copy`);
                  }}
                  title="Duplicate"
                  className="p-1 hover:text-text-main"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ${item.name}?`)) {
                    onDeleteFile(item.id);
                  }
                }}
                title="Delete"
                className="p-1 hover:text-error"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isFolder && isOpen && renderTree(item.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-bg-card border-r border-border text-text-main">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs uppercase font-semibold text-text-muted">
        <span>Files</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setTargetItem(null);
              setItemName('');
              setModalType('create_file');
            }}
            title="New File"
            className="p-1 rounded hover:bg-border-hover hover:text-text-main transition-colors"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setTargetItem(null);
              setItemName('');
              setModalType('create_folder');
            }}
            title="New Folder"
            className="p-1 rounded hover:bg-border-hover hover:text-text-main transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">
            No files yet. Click the + icon above to create one.
          </div>
        ) : (
          renderTree(null, 0)
        )}
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={
          modalType === 'create_file' ? 'Create New File' :
          modalType === 'create_folder' ? 'Create New Folder' :
          modalType === 'rename' ? 'Rename Item' : 'Action'
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={modalType === 'create_folder' ? 'components' : 'App.js'}
            required
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
