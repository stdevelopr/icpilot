import React, { useState, useEffect } from 'react';
import styles from './FilePreview.module.css';

const FilePreview = ({ fileContent, onClose, onDownload }) => {
  const isImage = fileContent.contentType.startsWith('image/');
  const isPdf = fileContent.contentType === 'application/pdf';
  const isText = fileContent.contentType.startsWith('text/');
  const isVideo = fileContent.contentType.startsWith('video/');
  const isAudio = fileContent.contentType.startsWith('audio/');
  const isJson = fileContent.contentType === 'application/json';
  const isHtml = fileContent.contentType === 'text/html';
  
  // For text content
  const [textContent, setTextContent] = useState('');
  // For data URL
  const [dataUrl, setDataUrl] = useState('');
  
  // Convert blob to data URL for better CSP compatibility
  useEffect(() => {
    if (fileContent.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        setDataUrl(reader.result);
      };
      reader.readAsDataURL(fileContent.blob);
    }
  }, [fileContent.blob]);
  
  // Load text content if needed
  useEffect(() => {
    if ((isText || isJson || isHtml) && fileContent.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        if (isJson) {
          try {
            const parsed = JSON.parse(reader.result);
            setTextContent(JSON.stringify(parsed, null, 2));
          } catch (error) {
            console.error('Error parsing JSON:', error);
            setTextContent('Error: Invalid JSON content');
          }
        } else {
          setTextContent(reader.result);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        setTextContent('Error: Unable to read file content');
      };
      reader.readAsText(fileContent.blob);
    }
  }, [fileContent.blob, isText, isJson, isHtml]);

  return (
    <div className="file-preview-overlay">
      <div className="file-preview-container">
        <div className="file-preview-header">
          <h3>{fileContent.name}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="file-preview-content">
          {isImage && dataUrl && (
            <img src={dataUrl} alt={fileContent.name} className={styles.previewImage} />
          )}
          
          {isPdf && (
            <div className={styles.pdfContainer}>
              <p>PDF files cannot be previewed directly due to security restrictions.</p>
              <button onClick={onDownload} className="download-button">
                Download to view PDF
              </button>
            </div>
          )}
          
          {isText && !isJson && !isHtml && (
            <pre className={styles.textPreview}>
              {textContent}
            </pre>
          )}
          
          {isVideo && dataUrl && (
            <video controls width="100%" className={styles.previewVideo}>
              <source src={dataUrl} type={fileContent.contentType} />
              Your browser does not support the video tag.
            </video>
          )}
          
          {isAudio && dataUrl && (
            <audio controls className={styles.previewAudio}>
              <source src={dataUrl} type={fileContent.contentType} />
              Your browser does not support the audio tag.
            </audio>
          )}
          
          {isJson && (
            <pre className={styles.jsonPreview}>
              {textContent}
            </pre>
          )}
          
          {isHtml && (
            <div className={styles.htmlPreviewContainer}>
              <p>HTML files cannot be previewed directly due to security restrictions.</p>
              <button onClick={onDownload} className="download-button">
                Download to view HTML
              </button>
              <div className={styles.htmlPreview}>
                <pre>{textContent}</pre>
              </div>
            </div>
          )}
          
          {!isImage && !isPdf && !isText && !isVideo && !isAudio && !isJson && !isHtml && (
            <div className={styles.downloadPrompt}>
              <p>This file type cannot be previewed directly.</p>
              <button onClick={onDownload}>Download File</button>
            </div>
          )}
        </div>
        
        <div className="file-preview-footer">
          <button onClick={onDownload} className="download-button">
            Download
          </button>
          {fileContent.path && (
            <div className={styles.filePathInfo}>
              <p>Path: {fileContent.path}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;