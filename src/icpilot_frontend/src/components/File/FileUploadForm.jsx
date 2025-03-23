import React from 'react';

const FileUploadForm = ({ 
  onSubmit, 
  onFileSelect, 
  onFileNameChange, 
  fileName, 
  selectedFile, 
  isLoading,
  currentFolder
}) => {
  return (
    <form onSubmit={onSubmit} className="file-upload-form">
      <div className="form-group">
        <label htmlFor="file">Select File:</label>
        <input 
          type="file" 
          id="file" 
          onChange={onFileSelect} 
          disabled={isLoading}
          multiple
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="directory">Or Select Folder:</label>
        <input 
          type="file" 
          id="directory" 
          onChange={onFileSelect} 
          disabled={isLoading}
          webkitdirectory=""
          directory=""
          multiple
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="fileName">File Name (optional):</label>
        <input 
          type="text" 
          id="fileName" 
          value={fileName} 
          onChange={onFileNameChange} 
          placeholder="Use original filename if empty"
          disabled={isLoading}
        />
      </div>
      
      {currentFolder && (
        <div className="current-folder">
          <p>Current folder: {currentFolder}</p>
        </div>
      )}
      
      <button type="submit" disabled={isLoading || !selectedFile}>
        {isLoading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};

export default FileUploadForm;