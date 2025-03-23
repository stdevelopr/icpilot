import React from 'react';
import styles from './FileTree.module.css';

const FileTree = ({ files }) => {
  // Function to build the file tree structure
  const buildFileTree = (files) => {
    const tree = {};

    files.forEach(file => {
      const pathParts = file.metadata.name.split('/');
      let currentLevel = tree;

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // This is a file
          if (!currentLevel.files) currentLevel.files = [];
          currentLevel.files.push(file);
        } else {
          // This is a directory
          if (!currentLevel.dirs) currentLevel.dirs = {};
          if (!currentLevel.dirs[part]) currentLevel.dirs[part] = {};
          currentLevel = currentLevel.dirs[part];
        }
      });
    });

    return tree;
  };

  // Recursive component to render directories and files
  const TreeNode = ({ node, path = '', onView, onDelete, isLoading }) => {
    return (
      <div className={styles.treeNode}>
        {node.dirs && Object.entries(node.dirs).map(([dirName, content]) => (
          <div key={dirName} className={styles.directory}>
            <div className={styles.dirHeader}>
              <span className={styles.folderIcon}>📁</span>
              <span className={styles.dirName}>{dirName}</span>
            </div>
            <div className={styles.dirContent}>
              <TreeNode
                node={content}
                path={`${path}${dirName}/`}
                onView={onView}
                onDelete={onDelete}
                isLoading={isLoading}
              />
            </div>
          </div>
        ))}
        {node.files && node.files.map(file => (
          <div key={file.id} className={styles.file}>
            <span className={styles.fileIcon}>📄</span>
            <span className={styles.fileName}>{file.metadata.name.split('/').pop()}</span>
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
        ))}
      </div>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className={styles.fileTree}>
      <TreeNode
        node={fileTree}
        onView={(fileId) => console.log('View file:', fileId)}
        onDelete={(fileId) => console.log('Delete file:', fileId)}
        isLoading={false}
      />
    </div>
  );
};

export default FileTree;