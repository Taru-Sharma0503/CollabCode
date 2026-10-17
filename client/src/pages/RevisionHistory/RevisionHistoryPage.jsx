import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { History, ArrowLeft, RotateCcw, GitCompare, Clock, User } from 'lucide-react';
import { revisionApi } from '../../services/revisionApi';
import { workspaceApi } from '../../services/workspaceApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DiffViewer from '../../components/DiffViewer/DiffViewer';

export default function RevisionHistoryPage() {
  const { workspaceId } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected for comparison
  const [fromRevId, setFromRevId] = useState(null);
  const [toRevId, setToRevId] = useState(null);
  const [diffFiles, setDiffFiles] = useState([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [comparing, setComparing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [wsData, revsData] = await Promise.all([
          workspaceApi.getById(workspaceId),
          revisionApi.list(workspaceId, { limit: 50 })
        ]);
        setWorkspace(wsData.workspace);
        const items = revsData.items || [];
        setRevisions(items);

        if (items.length >= 2) {
          setFromRevId(items[1].id);
          setToRevId(items[0].id);
        } else if (items.length === 1) {
          setToRevId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to load revisions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  useEffect(() => {
    async function compare() {
      if (!fromRevId || !toRevId || fromRevId === toRevId) {
        setDiffFiles([]);
        return;
      }

      setComparing(true);
      try {
        const res = await revisionApi.compare(workspaceId, fromRevId, toRevId);
        setDiffFiles(res.files || []);
        setSelectedFileIdx(0);
      } catch (err) {
        console.warn('Comparison failed:', err.message);
      } finally {
        setComparing(false);
      }
    }

    compare();
  }, [fromRevId, toRevId, workspaceId]);

  const handleRestore = async (revisionId) => {
    if (!window.confirm('Restore workspace to this historical version? Current changes will be automatically backed up.')) {
      return;
    }

    setRestoring(true);
    try {
      await revisionApi.restore(workspaceId, revisionId, workspace?.version);
      alert('Workspace successfully restored!');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/workspaces/${workspaceId}/editor`}>
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Back to Editor
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-text-main flex items-center space-x-2">
                <History className="w-5 h-5 text-accent" />
                <span>Revision History & Diffs</span>
              </h1>
              <p className="text-xs text-text-muted">Compare snapshots and restore previous checkpoints</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Revisions Timeline */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Timeline Snapshots ({revisions.length})</h2>
            <Card className="divide-y divide-border/60 p-0 overflow-hidden max-h-[75vh] overflow-y-auto">
              {revisions.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  No revisions yet. Click &quot;Save Revision&quot; inside the editor to create snapshots.
                </div>
              ) : (
                revisions.map((rev) => {
                  const isFrom = fromRevId === rev.id;
                  const isTo = toRevId === rev.id;

                  return (
                    <div
                      key={rev.id}
                      className={`p-4 space-y-2 transition-colors ${
                        isTo ? 'bg-accent/15 border-l-4 border-accent' :
                        isFrom ? 'bg-border-hover/40 border-l-4 border-text-muted' : 'hover:bg-bg-editor/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-accent">v{rev.version}</span>
                          <h4 className="text-xs font-semibold text-text-main">{rev.message}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(rev.id)}
                          loading={restoring}
                          icon={RotateCcw}
                          className="text-[11px] hover:text-warning"
                        >
                          Restore
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{rev.createdBy?.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(rev.createdAt).toLocaleString()}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1 text-[11px]">
                        <button
                          onClick={() => setFromRevId(rev.id)}
                          className={`px-2 py-0.5 rounded ${
                            isFrom ? 'bg-text-muted text-bg-main font-bold' : 'bg-bg-editor text-text-muted hover:text-text-main'
                          }`}
                        >
                          Base (From)
                        </button>
                        <button
                          onClick={() => setToRevId(rev.id)}
                          className={`px-2 py-0.5 rounded ${
                            isTo ? 'bg-accent text-white font-bold' : 'bg-bg-editor text-text-muted hover:text-text-main'
                          }`}
                        >
                          Target (To)
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Right: Diff Viewer */}
          <div className="lg:col-span-2 space-y-3 h-[75vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-main flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-accent" />
                <span>Diff Comparison</span>
              </h2>
              {diffFiles.length > 0 && (
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {diffFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFileIdx(idx)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedFileIdx === idx
                          ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                          : 'bg-bg-card border border-border text-text-muted hover:text-text-main'
                      }`}
                    >
                      {file.name} ({file.status})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 bg-bg-card border border-border rounded-surface overflow-hidden">
              {comparing ? (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  Calculating line diffs...
                </div>
              ) : diffFiles.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-text-muted p-6 text-center">
                  Select two different revisions on the left to inspect file differences.
                </div>
              ) : (
                <DiffViewer
                  fileName={diffFiles[selectedFileIdx]?.name}
                  oldCode={diffFiles[selectedFileIdx]?.oldContent || ''}
                  newCode={diffFiles[selectedFileIdx]?.newContent || ''}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
