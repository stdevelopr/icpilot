import React, { useState } from 'react';
import styles from './FileTree.module.css';

const FileTree = ({ files, onView, onDelete, isLoading }) => {
  // Function to build the file tree structure
  const buildFileTree = (files) => {
    const tree = { dirs: {}, files: [] };

    // First, sort files to ensure directories are processed first
    const sortedFiles = [...files].sort((a, b) => {
      // Sort directories first, then by path length (shorter paths first)
      const aIsDir = a.metadata.isDirectory;
      const bIsDir = b.metadata.isDirectory;
      
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      
      return a.metadata.path.length - b.metadata.path.length;
    });

    sortedFiles.forEach(file => {
      const pathParts = file.metadata.path.split('/').filter(part => part.length > 0);
      
      if (pathParts.length === 0) {
        // Root level file
        tree.files.push(file);
        return;
      }

      let currentLevel = tree;
      
      // Process all path parts except the last one (which is the file name for files)
      const partsToProcess = file.metadata.isDirectory ? pathParts : pathParts.slice(0, -1);
      
      partsToProcess.forEach((part, index) => {
        if (!currentLevel.dirs[part]) {
          currentLevel.dirs[part] = { dirs: {}, files: [] };
        }
        currentLevel = currentLevel.dirs[part];
      });
      
      // Add the file to the appropriate level
      if (file.metadata.isDirectory) {
        // This is a directory, already processed
      } else {
        // This is a file, add it to the current directory
        currentLevel.files.push(file);
      }
    });

    return tree;
  };

  // Directory component with collapsible content
  const Directory = ({ name, content, path, onView, onDelete, isLoading }) => {
    const [expanded, setExpanded] = useState(true);
    
    const toggleExpand = () => setExpanded(!expanded);
    
    return (
      <div className={styles.directory}>
        <div className={styles.dirHeader} onClick={toggleExpand}>
          <span className={styles.folderIcon}>{expanded ? '📂' : '📁'}</span>
          <span className={styles.dirName}>{name}</span>
        </div>
        
        {expanded && (
          <div className={styles.dirContent}>
            <TreeNode 
              node={content} 
              path={path ? `${path}/${name}` : name}
              onView={onView}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    );
  };

  // File component
  const File = ({ file, onView, onDelete, isLoading }) => {
    return (
      <div className={styles.file}>
        <span className={styles.fileIcon}>📄</span>
        <span className={styles.fileName}>{file.metadata.name}</span>
        <div className={styles.fileActions}>
          <button
            onClick={() => onView(file.id)}
            disabled={isLoading}
            className={styles.viewBtn}
          >
            View
          </button>
          <button
            onClick={() => onDelete(file.id)}
            disabled={isLoading}
            className={styles.deleteBtn}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  // Recursive component to render directories and files
  const TreeNode = ({ node, path = '', onView, onDelete, isLoading }) => {
    return (
      <div className={styles.treeNode}>
        {/* Render directories */}
        {node.dirs && Object.entries(node.dirs).map(([dirName, content]) => (
          <Directory
            key={dirName}
            name={dirName}
            content={content}
            path={path}
            onView={onView}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        ))}
        
        {/* Render files */}
        {node.files && node.files.map(file => (
          <File
            key={file.id}
            file={file}
            onView={onView}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        ))}
      </div>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className={styles.fileTree}>
      <TreeNode
        node={fileTree}
        onView={onView}
        onDelete={onDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FileTree;