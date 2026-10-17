import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';

export default function CollaborativeMonacoEditor({
  activeFile,
  ydoc,
  provider,
  onCursorChange
}) {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme matching CollabCode design system
    monaco.editor.defineTheme('collabcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
        { token: 'keyword', foreground: '6C8CFF' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'FBBF24' }
      ],
      colors: {
        'editor.background': '#0B1220',
        'editor.foreground': '#F1F5F9',
        'editor.lineHighlightBackground': '#18243850',
        'editorCursor.foreground': '#6C8CFF',
        'editorWhitespace.foreground': '#26364D',
        'editorIndentGuide.background': '#182438',
        'editorIndentGuide.activeBackground': '#26364D'
      }
    });

    monaco.editor.setTheme('collabcode-dark');

    // Track cursor changes for presence broadcast
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column
        });
      }
    });

    bindYjs(editor);
  };

  const bindYjs = (editor) => {
    if (!ydoc || !editor) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    try {
      const ytext = ydoc.getText('monaco');
      const model = editor.getModel();

      if (model && ytext) {
        bindingRef.current = new MonacoBinding(
          ytext,
          model,
          new Set([editor])
        );
      }
    } catch (err) {
      console.warn('[MonacoEditor] Failed to bind Yjs:', err);
    }
  };

  useEffect(() => {
    if (editorRef.current && ydoc) {
      bindYjs(editorRef.current);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFile?.id, ydoc]);

  return (
    <div className="w-full h-full bg-bg-editor">
      <Editor
        height="100%"
        language={activeFile?.language || 'javascript'}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on'
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}
