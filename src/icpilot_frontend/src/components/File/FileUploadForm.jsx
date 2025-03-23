import React from 'react';

const FileUploadForm = ({ 
  onSubmit, 
  onFileSelect, 
  onFileNameChange, 
  fileName, 
  selectedFile, 
  isLoading 
}) => {
  return (
    <form onSubmit={onSubmit} className="file-upload-form">
      <div className="form-group">
        <label htmlFor="file">Select File or Folder:</label>
        <input 
          type="file" 
          id="file" 
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
      
      <button type="submit" disabled={isLoading || !selectedFile}>
        {isLoading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};

export default FileUploadForm;