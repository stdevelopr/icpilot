import React from 'react';
import styles from './FileItem.module.css';

// Simple function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

const FileItem = ({ file, onView, onDelete, isLoading }) => {
  return (
    <li className="file-item">
      <div className="file-info">
        <strong>{file.metadata.name}</strong>
        <p>Type: {file.metadata.contentType}</p>
        <p>Size: {formatFileSize(file.metadata.size)}</p>
      </div>
      <div className="file-actions">
        <button 
          onClick={onView} 
          disabled={isLoading}
          className="view-btn"
        >
          View
        </button>
        <button 
          onClick={onDelete} 
          disabled={isLoading}
          className="delete-btn"
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default FileItem;