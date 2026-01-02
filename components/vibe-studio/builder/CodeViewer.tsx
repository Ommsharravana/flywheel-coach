'use client';

import { useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { useBuilderStore, GeneratedFile } from '@/lib/stores/vibeBuilderStore';

export function CodeViewer() {
  const { files, activeFile, setActiveFile } = useBuilderStore();
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const activeFileContent = files.find(f => f.path === activeFile);

  const copyCode = async () => {
    if (!activeFileContent) return;
    await navigator.clipboard.writeText(activeFileContent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build folder tree structure
  const buildTree = (files: GeneratedFile[]) => {
    const tree: Record<string, { files: GeneratedFile[]; folders: Set<string> }> = {};

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length - 1; i++) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

        if (!tree[parentPath]) {
          tree[parentPath] = { files: [], folders: new Set() };
        }
        tree[parentPath].folders.add(currentPath);
      }

      const folderPath = parts.slice(0, -1).join('/');
      if (!tree[folderPath]) {
        tree[folderPath] = { files: [], folders: new Set() };
      }
      tree[folderPath].files.push(file);
    });

    return tree;
  };

  const tree = buildTree(files);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTree = (path: string, depth: number = 0) => {
    const node = tree[path];
    if (!node) return null;

    const sortedFolders = Array.from(node.folders).sort();
    const sortedFiles = [...node.files].sort((a, b) => a.path.localeCompare(b.path));

    return (
      <>
        {sortedFolders.map(folderPath => {
          const folderName = folderPath.split('/').pop() || folderPath;
          const isExpanded = expandedFolders.has(folderPath);

          return (
            <div key={folderPath}>
              <button
                onClick={() => toggleFolder(folderPath)}
                className="w-full flex items-center gap-1 px-2 py-1 hover:bg-[#1a1a1a] text-left text-sm text-gray-400"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Folder className="w-3 h-3 text-yellow-500" />
                <span className="font-mono text-xs">{folderName}</span>
              </button>
              {isExpanded && renderTree(folderPath, depth + 1)}
            </div>
          );
        })}
        {sortedFiles.map(file => {
          const fileName = file.path.split('/').pop() || file.path;
          const isActive = file.path === activeFile;

          return (
            <button
              key={file.path}
              onClick={() => setActiveFile(file.path)}
              className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm ${
                isActive
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'text-gray-400 hover:bg-[#1a1a1a]'
              }`}
              style={{ paddingLeft: `${depth * 12 + 24}px` }}
            >
              <File className="w-3 h-3" />
              <span className="font-mono text-xs truncate">{fileName}</span>
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-[#333]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <File className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-400 font-mono tracking-wider">
            CODE_VIEWER
          </span>
        </div>
        {activeFileContent && (
          <button
            onClick={copyCode}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File tree */}
        <div className="w-48 border-r border-[#333] overflow-y-auto">
          {files.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs font-mono">
              No files yet
            </div>
          ) : (
            <div className="py-2">
              {renderTree('')}
            </div>
          )}
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto">
          {activeFileContent ? (
            <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap">
              <code>{activeFileContent.content}</code>
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
              {files.length > 0 ? 'Select a file to view' : 'Generated code will appear here'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
