import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Y from 'yjs';
import {
  Users,
  MessageSquare,
  MessageCircle,
  Terminal,
  History,
  FileCode,
  Share2,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import { workspaceApi } from '../../services/workspaceApi';
import { fileApi } from '../../services/fileApi';
import { commentApi } from '../../services/commentApi';
import { executionApi } from '../../services/executionApi';
import { revisionApi } from '../../services/revisionApi';
import { getSocket } from '../../collaboration/socket';
import { SocketIOYjsProvider } from '../../collaboration/provider';
import { useAuth } from '../../context/AuthContext';
import { SOCKET_EVENTS } from '../../../../shared/contracts/socketEvents';

import Navbar from '../../components/layout/Navbar';
import FileExplorer from '../../components/FileExplorer/FileExplorer';
import CollaborativeMonacoEditor from '../../components/Editor/MonacoEditor';
import PresencePanel from '../../components/Presence/PresencePanel';
import ChatPanel from '../../components/Chat/ChatPanel';
import CommentsPanel from '../../components/Comments/CommentsPanel';
import ExecutionPanel from '../../components/ExecutionPanel/ExecutionPanel';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function WorkspaceEditorPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [comments, setComments] = useState([]);

  // Panel state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState('chat'); // 'chat', 'comments', 'presence', null
  const [bottomOpen, setBottomOpen] = useState(false);

  // Execution state
  const [execution, setExecution] = useState(null);
  const [outputChunks, setOutputChunks] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Snapshot modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  // Yjs provider state
  const [ydoc, setYdoc] = useState(null);
  const providerRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Initial Load: Workspace, Files, Chat, Comments
  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceData() {
      try {
        const [wsData, filesData, msgsData, commentsData] = await Promise.all([
          workspaceApi.getById(workspaceId),
          fileApi.list(workspaceId),
          workspaceApi.getMessages(workspaceId),
          commentApi.list(workspaceId)
        ]);

        if (!isMounted) return;

        setWorkspace(wsData.workspace);
        setFiles(filesData.items || []);
        setChatMessages(msgsData.items || []);
        setComments(commentsData.items || []);

        // Pick initial active file
        const firstFile = (filesData.items || []).find((f) => f.type === 'file');
        if (firstFile) {
          setActiveFile(firstFile);
        }
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      }
    }

    loadWorkspaceData();
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  // 2. Setup Socket.IO connection and workspace room
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    // Join workspace
    socket.emit(SOCKET_EVENTS.WORKSPACE_JOIN, { workspaceId }, (ack) => {
      if (ack?.ok && ack.presence) {
        setCollaborators(ack.presence);
      }
    });

    // Listen to presence updates
    const onPresenceUpdated = (presence) => {
      setCollaborators((prev) => {
        const idx = prev.findIndex((p) => p.userId === presence.userId);
        if (presence.status === 'offline') {
          return prev.filter((p) => p.userId !== presence.userId);
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = presence;
          return next;
        }
        return [...prev, presence];
      });
    };

    // Listen to file tree changes
    const onFileCreated = (newFile) => {
      setFiles((prev) => {
        if (prev.some((f) => f.id === newFile.id)) return prev;
        return [...prev, newFile];
      });
    };

    const onFileRenamed = (renamedFile) => {
      setFiles((prev) => prev.map((f) => (f.id === renamedFile.id ? renamedFile : f)));
      setActiveFile((cur) => (cur?.id === renamedFile.id ? renamedFile : cur));
    };

    const onFileDeleted = ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setActiveFile((cur) => (cur?.id === fileId ? null : cur));
    };

    // Listen to chat messages
    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    // Listen to comment events
    const onCommentCreated = (comment) => {
      setComments((prev) => [comment, ...prev]);
    };

    const onCommentResolved = ({ commentId, status }) => {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status } : c))
      );
    };

    // Listen to execution streaming
    const onExecOutput = (chunk) => {
      setOutputChunks((prev) => [...prev, { stream: chunk.stream, text: chunk.chunk }]);
    };

    const onExecStatus = (statusData) => {
      setExecution((prev) => ({ ...(prev || {}), ...statusData }));
      if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'cancelled') {
        setIsExecuting(false);
      }
    };

    socket.on(SOCKET_EVENTS.PRESENCE_UPDATED, onPresenceUpdated);
    socket.on(SOCKET_EVENTS.FILE_CREATED, onFileCreated);
    socket.on(SOCKET_EVENTS.FILE_RENAMED, onFileRenamed);
    socket.on(SOCKET_EVENTS.FILE_DELETED, onFileDeleted);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_EVENTS.COMMENT_CREATED, onCommentCreated);
    socket.on(SOCKET_EVENTS.COMMENT_RESOLVED, onCommentResolved);
    socket.on(SOCKET_EVENTS.EXECUTION_OUTPUT, onExecOutput);
    socket.on(SOCKET_EVENTS.EXECUTION_STATUS, onExecStatus);

    return () => {
      socket.emit(SOCKET_EVENTS.WORKSPACE_LEAVE, { workspaceId });
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATED, onPresenceUpdated);
      socket.off(SOCKET_EVENTS.FILE_CREATED, onFileCreated);
      socket.off(SOCKET_EVENTS.FILE_RENAMED, onFileRenamed);
      socket.off(SOCKET_EVENTS.FILE_DELETED, onFileDeleted);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_EVENTS.COMMENT_CREATED, onCommentCreated);
      socket.off(SOCKET_EVENTS.COMMENT_RESOLVED, onCommentResolved);
      socket.off(SOCKET_EVENTS.EXECUTION_OUTPUT, onExecOutput);
      socket.off(SOCKET_EVENTS.EXECUTION_STATUS, onExecStatus);
    };
  }, [workspaceId]);

  // 3. Document provider binding when activeFile changes
  useEffect(() => {
    if (!activeFile || activeFile.type !== 'file') {
      setYdoc(null);
      return;
    }

    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }

    const socket = getSocket();
    const doc = new Y.Doc();

    // Broadcast active file to presence
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        workspaceId,
        activeFileId: activeFile.id,
        status: 'active'
      });
    }

    // Connect Yjs provider
    const provider = new SocketIOYjsProvider({
      workspaceId,
      fileId: activeFile.id,
      ydoc: doc,
      socket
    });

    providerRef.current = provider;
    setYdoc(doc);

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [activeFile?.id, workspaceId]);

  // File Operations Handlers
  const handleCreateFile = async (data) => {
    try {
      const res = await fileApi.create(workspaceId, data);
      setFiles((prev) => [...prev, res.file]);
      if (res.file.type === 'file') {
        setActiveFile(res.file);
      }
    } catch (err) {
      alert(err.message || 'Failed to create file');
    }
  };

  const handleRenameFile = async (fileId, newName) => {
    try {
      const res = await fileApi.update(workspaceId, fileId, { name: newName });
      setFiles((prev) => prev.map((f) => (f.id === fileId ? res.file : f)));
    } catch (err) {
      alert(err.message || 'Failed to rename file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await fileApi.delete(workspaceId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (activeFile?.id === fileId) {
        setActiveFile(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const handleDuplicateFile = async (fileId, copyName) => {
    try {
      const res = await fileApi.duplicate(workspaceId, fileId, { name: copyName });
      setFiles((prev) => [...prev, res.file]);
    } catch (err) {
      alert(err.message || 'Failed to duplicate file');
    }
  };

  // Chat message sending
  const handleSendMessage = (body) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.CHAT_SEND, {
        workspaceId,
        clientMessageId: `msg_${Date.now()}`,
        body
      });
    }
  };

  // Comments handlers
  const handleCreateComment = async (data) => {
    try {
      await commentApi.create(workspaceId, data);
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  const handleReplyComment = async (commentId, body) => {
    try {
      const res = await commentApi.reply(workspaceId, commentId, { body });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...(c.replies || []), res.reply] } : c
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to post reply');
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      await commentApi.resolve(workspaceId, commentId);
    } catch (err) {
      console.warn('Failed to resolve comment:', err);
    }
  };

  const handleReopenComment = async (commentId) => {
    try {
      await commentApi.reopen(workspaceId, commentId);
    } catch (err) {
      console.warn('Failed to reopen comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.delete(workspaceId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  // Execution runner
  const handleRunCode = async () => {
    if (!activeFile) return;

    setOutputChunks([]);
    setBottomOpen(true);
    setIsExecuting(true);

    try {
      const res = await executionApi.submit(workspaceId, {
        fileId: activeFile.id,
        language: activeFile.language || 'javascript',
        stdin: ''
      });
      setExecution(res.execution);
    } catch (err) {
      setOutputChunks([{ stream: 'stderr', text: err.message || 'Execution submission failed.' }]);
      setIsExecuting(false);
    }
  };

  const handleCancelExecution = async () => {
    if (!execution?.id) return;
    try {
      await executionApi.cancel(workspaceId, execution.id);
      setIsExecuting(false);
    } catch (err) {
      console.warn('Failed to cancel execution:', err);
    }
  };

  // Create Snapshot Revision
  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!snapshotMessage.trim()) return;

    setCreatingSnapshot(true);
    try {
      await revisionApi.create(workspaceId, { message: snapshotMessage.trim() });
      setSnapshotModalOpen(false);
      setSnapshotMessage('');
      alert('Snapshot revision created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create revision snapshot.');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-main text-text-main overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        workspace={workspace}
        collaborators={collaborators}
        onRun={handleRunCode}
        isExecuting={isExecuting}
        isSynced={true}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collapsible File Explorer */}
        {leftSidebarOpen && (
          <div className="w-56 shrink-0 h-full">
            <FileExplorer
              files={files}
              activeFileId={activeFile?.id}
              onSelectFile={(f) => setActiveFile(f)}
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
              onDuplicateFile={handleDuplicateFile}
            />
          </div>
        )}

        {/* Center: Tabs + Monaco Editor + Bottom Execution Panel */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* File Tabs Toolbar */}
          <div className="h-9 border-b border-border bg-bg-main flex items-center justify-between px-2 select-none">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="p-1 rounded text-text-muted hover:text-text-main hover:bg-border-hover/50 mr-1"
                title={leftSidebarOpen ? 'Hide Files' : 'Show Files'}
              >
                {leftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {activeFile ? (
                <div className="flex items-center space-x-2 bg-bg-editor border-t-2 border-accent px-3 py-1.5 text-xs font-medium text-text-main rounded-t">
                  <FileCode className="w-3.5 h-3.5 text-accent" />
                  <span>{activeFile.name}</span>
                </div>
              ) : (
                <span className="text-xs text-text-muted italic px-2">No file open</span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setSnapshotModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-border text-text-main hover:bg-border-hover transition-colors font-medium"
                title="Create revision snapshot"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Revision</span>
              </button>
              <Link
                to={`/workspaces/${workspaceId}/history`}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-border text-text-main hover:bg-border-hover transition-colors font-medium"
              >
                <History className="w-3.5 h-3.5 text-accent" />
                <span>History</span>
              </Link>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-bg-editor">
            {activeFile && ydoc ? (
              <CollaborativeMonacoEditor
                activeFile={activeFile}
                ydoc={ydoc}
                provider={providerRef.current}
                onCursorChange={(pos) => {
                  if (socketRef.current?.connected) {
                    socketRef.current.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
                      workspaceId,
                      activeFileId: activeFile.id,
                      status: 'active',
                      cursor: pos
                    });
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Select or create a file from the explorer to begin editing.
              </div>
            )}
          </div>

          {/* Bottom Execution Terminal */}
          {bottomOpen && (
            <ExecutionPanel
              execution={execution}
              outputChunks={outputChunks}
              isExecuting={isExecuting}
              onCancel={handleCancelExecution}
              onClear={() => setOutputChunks([])}
            />
          )}
        </div>

        {/* Right: Collapsible Tool Panels */}
        {rightTab && (
          <div className="w-80 shrink-0 h-full border-l border-border bg-bg-card flex flex-col">
            <div className="h-9 border-b border-border flex items-center justify-between px-2 bg-bg-main text-xs">
              <div className="flex items-center space-x-1">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageSquare },
                  { id: 'comments', label: 'Comments', icon: MessageCircle },
                  { id: 'presence', label: 'Team', icon: Users }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${
                      rightTab === tab.id
                        ? 'bg-accent/20 text-accent font-semibold'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setRightTab(null)}
                className="text-text-muted hover:text-text-main p-1"
                title="Close panel"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {rightTab === 'chat' && (
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  currentUser={user}
                />
              )}
              {rightTab === 'comments' && (
                <CommentsPanel
                  comments={comments}
                  activeFile={activeFile}
                  onCreateComment={handleCreateComment}
                  onReplyComment={handleReplyComment}
                  onResolveComment={handleResolveComment}
                  onReopenComment={handleReopenComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}
              {rightTab === 'presence' && (
                <PresencePanel
                  collaborators={collaborators}
                  activeFile={activeFile}
                />
              )}
            </div>
          </div>
        )}

        {/* Right Toggle Bar when panel is collapsed */}
        {!rightTab && (
          <div className="w-10 shrink-0 border-l border-border bg-bg-card flex flex-col items-center py-2 space-y-3">
            <button
              onClick={() => setRightTab('chat')}
              className="p-2 text-text-muted hover:text-accent rounded"
              title="Open Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRightTab('comments')}
              className="p-2 text-text-muted hover:text-accent rounded"
              title="Open Comments"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRightTab('presence')}
              className="p-2 text-text-muted hover:text-accent rounded"
              title="Open Team"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Snapshot Revision Modal */}
      <Modal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        title="Create Revision Snapshot"
      >
        <form onSubmit={handleCreateSnapshot} className="space-y-4">
          <Input
            label="Revision Message"
            value={snapshotMessage}
            onChange={(e) => setSnapshotMessage(e.target.value)}
            placeholder="e.g. Added auth middleware and tested endpoints"
            required
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setSnapshotModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creatingSnapshot}>
              Create Snapshot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
