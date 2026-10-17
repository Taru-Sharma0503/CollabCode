import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Zap, Users, History, Play, Shield, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-bold tracking-tight">Collab<span className="text-accent">Code</span></span>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">
            Sign In
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-Time CRDT Collaboration Powered by Yjs</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300">
          Code Together. Build Faster.
        </h1>

        <p className="mt-5 text-lg text-text-muted max-w-2xl leading-relaxed">
          Browser-based collaborative cloud IDE where engineering teams code simultaneously, see live cursors, discuss changes inline, compare revisions, and run programs in sandboxed environments.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register">
            <Button size="lg" variant="primary" icon={ArrowRight} className="px-8 shadow-lg shadow-accent/20">
              Start Collaborating Free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="px-8">
              Sign In to Workspaces
            </Button>
          </Link>
        </div>

        {/* IDE Preview Mockup */}
        <div className="mt-14 w-full max-w-5xl rounded-surface border border-border bg-bg-card shadow-2xl overflow-hidden text-left">
          <div className="h-10 bg-bg-main border-b border-border px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs text-text-muted font-mono ml-3">CollabCode — Study Project / App.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-white font-bold">A</div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">B</div>
            </div>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed bg-bg-editor">
            <p><span className="text-accent">import</span> &#123; createServer &#125; <span className="text-accent">from</span> <span className="text-success">&apos;http&apos;</span>;</p>
            <p className="mt-2"><span className="text-accent">function</span> <span className="text-warning">collabEngine</span>(collaborators) &#123;</p>
            <p className="ml-4 text-text-muted">// Synchronize edits with zero conflict</p>
            <p className="ml-4"><span className="text-accent">return</span> collaborators.map(c =&gt; c.name); <span className="bg-accent/30 text-accent font-semibold px-1 rounded text-xs ml-2">Alice editing</span></p>
            <p>&#125;</p>
            <p className="mt-2 text-emerald-400 font-bold">&gt; Program executed successfully with exit code 0.</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 rounded-surface bg-bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-main">Real-time Yjs CRDTs</h3>
            <p className="text-sm text-text-muted">
              Sub-millisecond concurrent editing and presence cursors powered by Yjs and Socket.IO. No accidental overwrites.
            </p>
          </div>

          <div className="p-6 rounded-surface bg-bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-main">Revision Snapshots & Diffs</h3>
            <p className="text-sm text-text-muted">
              Inspect project history checkpoints, compare line-by-line diffs across versions, and safely restore anytime.
            </p>
          </div>

          <div className="p-6 rounded-surface bg-bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-main">Isolated Code Execution</h3>
            <p className="text-sm text-text-muted">
              Run programs inside sandboxed runners with CPU/memory limits, interactive stdin, and live stdout streaming.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-text-muted">
        <p>&copy; {new Date().getFullYear()} CollabCode Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
