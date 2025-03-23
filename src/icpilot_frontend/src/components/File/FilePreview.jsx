import React, { useState, useEffect } from 'react';
import styles from './FilePreview.module.css';

const FilePreview = ({ fileContent, onClose, onDownload }) => {
  const isImage = fileContent.contentType.startsWith('image/');
  const isPdf = fileContent.contentType === 'application/pdf';
  const isText = fileContent.contentType.startsWith('text/');
  const isVideo = fileContent.contentType.startsWith('video/');
  const isAudio = fileContent.contentType.startsWith('audio/');
  const isJson = fileContent.contentType === 'application/json';

  return (
    <div className="file-preview-overlay">
      <div className="file-preview-container">
        <div className="file-preview-header">
          <h3>{fileContent.name}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="file-preview-content">
          {isImage && (
            <img src={fileContent.url} alt={fileContent.name} />
          )}
          
          {isPdf && (
            <iframe 
              src={fileContent.url} 
              title={fileContent.name}
              width="100%" 
              height="500px"
            />
          )}
          
          {isText && (
            <iframe 
              src={fileContent.url} 
              title={fileContent.name}
              width="100%" 
              height="500px"
            />
          )}
          
          {isVideo && (
            <video controls width="100%">
              <source src={fileContent.url} type={fileContent.contentType} />
              Your browser does not support the video tag.
            </video>
          )}
          
          {isAudio && (
            <audio controls>
              <source src={fileContent.url} type={fileContent.contentType} />
              Your browser does not support the audio tag.
            </audio>
          )}
          
          {isJson && (() => {
            const [jsonContent, setJsonContent] = useState('Loading...');
            
            useEffect(() => {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(reader.result);
                  setJsonContent(JSON.stringify(parsed, null, 2));
                } catch (error) {
                  console.error('Error parsing JSON:', error);
                  setJsonContent('Error: Invalid JSON content');
                }
              };
              reader.onerror = () => {
                console.error('Error reading file:', reader.error);
                setJsonContent('Error: Unable to read file content');
              };
              reader.readAsText(fileContent.blob);
            }, [fileContent.blob]);

            return (
              <pre className={styles['json-preview']}>
                {jsonContent}
              </pre>
            );
          })()}
          
          {!isImage && !isPdf && !isText && !isVideo && !isAudio && !isJson && (
            <div className="download-prompt">
              <p>This file type cannot be previewed directly.</p>
              <button onClick={onDownload}>Download File</button>
            </div>
          )}
        </div>
        
        <div className="file-preview-footer">
          <button onClick={onDownload} className="download-button">
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;