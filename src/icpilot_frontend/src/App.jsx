import { icpilot_backend } from 'declarations/icpilot_backend';
import { useState, useEffect } from 'react';
import { convertBigIntValues } from './utils';

function App() {
  const [canisters, setCanisters] = useState([]);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('canisters');

  // Fetch user's canisters and files on component mount
  useEffect(() => {
    fetchCanisters();
    fetchFiles();
  }, []);

  async function fetchCanisters() {
    try {
      const userCanisters = await icpilot_backend.get_caller_canisters();
      setCanisters(userCanisters);
    } catch (error) {
      console.error("Error fetching canisters:", error);
    }
  }

  async function fetchFiles() {
    try {
      const userFiles = await icpilot_backend.getMyFiles();
      // Convert BigInt values to regular numbers or strings
      setFiles(convertBigIntValues(userFiles));
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await icpilot_backend.create_canister("My Canister", "This is a description of my canister");
      
      if ("ok" in result) {
        // Success case
        const canisterId = result.ok;
        setMessage({ type: 'success', text: `Successfully created canister: ${canisterId}` });
        // Refresh the canister list
        fetchCanisters();
      } else {
        // Error case
        setMessage({ type: 'error', text: `Failed to create canister: ${result.err}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
    
    return false;
  }

  async function handleFileUpload(event) {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setFileLoading(true);
    setMessage(null);

    try {
      // Read the file as an ArrayBuffer
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(fileReader.result);
          
          // Upload the file
          const result = await icpilot_backend.uploadFile(
            fileName || selectedFile.name,
            selectedFile.type || 'application/octet-stream',
            [...uint8Array]
          );
          
          if ("ok" in result) {
            setMessage({ type: 'success', text: `Successfully uploaded file: ${fileName || selectedFile.name}` });
            fetchFiles();
            setSelectedFile(null);
            setFileName('');
          } else {
            setMessage({ type: 'error', text: `Failed to upload file: ${result.err}` });
          }
        } catch (error) {
          console.error("Error in file upload:", error);
          setMessage({ type: 'error', text: `Error uploading file: ${error.message}` });
        } finally {
          setFileLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        setMessage({ type: 'error', text: 'Error reading file' });
        setFileLoading(false);
      };
      
      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setFileLoading(false);
    }
  }

  async function handleFileDelete(fileId) {
    try {
      setFileLoading(true);
      const result = await icpilot_backend.deleteFile(fileId);
      
      if ("ok" in result) {
        setMessage({ type: 'success', text: 'File deleted successfully' });
        fetchFiles();
      } else {
        setMessage({ type: 'error', text: `Failed to delete file: ${result.err}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error deleting file: ${error.message}` });
    } finally {
      setFileLoading(false);
    }
  }

  async function handleViewFile(fileId) {
    try {
      setFileLoading(true);
      
      // First get the file metadata to ensure we have the correct information
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        setMessage({ type: 'error', text: 'File not found in your files list' });
        setFileLoading(false);
        return;
      }
      
      const content = await icpilot_backend.getFileContent(fileId);
      
      if (content) {
        console.log("Raw content:", content);
        
        // Use the metadata from our files state which is already processed
        const processedMetadata = file.metadata;
        
        // Log the metadata to debug
        console.log("File metadata:", processedMetadata);
        
        // Ensure contentType exists, default to 'application/octet-stream' if not
        const contentType = processedMetadata.contentType || 'application/octet-stream';
        
        // Make sure we have a valid file name
        const fileName = processedMetadata.name || 'Unknown File';
        
        // Extract all byte values from the nested structure
        let bytes = [];
        
        // Recursive function to extract all numeric values from nested objects
        function extractBytes(obj) {
          if (typeof obj === 'number') {
            bytes.push(obj);
          } else if (Array.isArray(obj)) {
            obj.forEach(item => extractBytes(item));
          } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(value => extractBytes(value));
          }
        }
        
        extractBytes(content);
        
        console.log("Extracted bytes length:", bytes.length);
        
        // Create a Uint8Array from the extracted bytes
        const uint8Array = new Uint8Array(bytes);
        
        // Create a blob with the content type
        const blob = new Blob([uint8Array], { type: contentType });
        
        console.log("File preview data:", {
          name: fileName,
          contentType: contentType,
          size: processedMetadata.size,
          blobSize: blob.size,
          extractedBytesLength: bytes.length
        });
        
        // Test the blob content
        if (blob.size > 0) {
          // Create a URL for the blob
          const url = URL.createObjectURL(blob);
          
          setFileContent({
            url,
            contentType,
            name: fileName,
            blob, // Store the blob for direct download
            fileId // Store the fileId for reference
          });
        } else {
          setMessage({ type: 'error', text: 'File content appears to be empty after processing' });
        }
      } else {
        setMessage({ type: 'error', text: 'File content not found or empty' });
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      setMessage({ type: 'error', text: `Error viewing file: ${error.message}` });
    } finally {
      setFileLoading(false);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    setSelectedFile(file);
  }

  function closeFilePreview() {
    if (fileContent && fileContent.url) {
      URL.revokeObjectURL(fileContent.url);
    }
    setFileContent(null);
  }

  // Add this function to handle direct downloads
  // Improved download function
  function handleDownload() {
    if (fileContent && fileContent.blob) {
      try {
        // Find the file in our files array to get the correct name
        const file = files.find(f => f.id === fileContent.fileId);
        const fileName = file ? file.metadata.name : fileContent.name || 'download.file';
        
        console.log("Downloading file:", fileName, "Size:", fileContent.blob.size);
        
        // Create a download URL directly from the original blob
        const downloadUrl = URL.createObjectURL(fileContent.blob);
        
        // Create and trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 200);
      } catch (error) {
        console.error("Download error:", error);
        setMessage({ type: 'error', text: `Error downloading file: ${error.message}` });
      }
    } else {
      console.error("No file content available for download");
      setMessage({ type: 'error', text: 'No file content available for download' });
    }
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tab-buttons">
        <button 
          className={activeTab === 'canisters' ? 'active' : ''} 
          onClick={() => setActiveTab('canisters')}
        >
          Canister Management
        </button>
        <button 
          className={activeTab === 'files' ? 'active' : ''} 
          onClick={() => setActiveTab('files')}
        >
          File Management
        </button>
      </div>

      {activeTab === 'canisters' && (
        <div className="tab-section">
          <h2>Canister Management</h2>
          <div className="manager-toggle">
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Canister'}
            </button>
          </div>

          {canisters.length > 0 && (
            <div className="canister-list">
              <h3>Your Canisters</h3>
              <ul>
                {canisters.map((canister, index) => (
                  <li key={index}>
                    <strong>{canister.metadata.name}</strong> ({canister.id})
                    <p>{canister.metadata.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className="tab-section">
          <h2>File Management</h2>
          
          <form onSubmit={handleFileUpload} className="file-upload-form">
            <div className="form-group">
              <label htmlFor="file">Select File:</label>
              <input 
                type="file" 
                id="file" 
                onChange={handleFileSelect} 
                disabled={fileLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fileName">File Name (optional):</label>
              <input 
                type="text" 
                id="fileName" 
                value={fileName} 
                onChange={(e) => setFileName(e.target.value)} 
                placeholder="Use original filename if empty"
                disabled={fileLoading}
              />
            </div>
            
            <button type="submit" disabled={fileLoading || !selectedFile}>
              {fileLoading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>

          {files.length > 0 ? (
            <div className="file-list">
              <h3>Your Files</h3>
              <ul>
                {files.map((file, index) => (
                  <li key={index} className="file-item">
                    <div className="file-info">
                      <strong>{file.metadata.name}</strong>
                      <p>Type: {file.metadata.contentType}</p>
                      <p>Size: {formatFileSize(file.metadata.size)}</p>
                    </div>
                    <div className="file-actions">
                      <button 
                        onClick={() => handleViewFile(file.id)}
                        disabled={fileLoading}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleFileDelete(file.id)}
                        disabled={fileLoading}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="no-files">
              <p>You haven't uploaded any files yet.</p>
            </div>
          )}

          {fileContent && (
            <div className="file-preview-overlay">
              <div className="file-preview">
                <div className="preview-header">
                  <h3>{fileContent.name}</h3>
                  <button onClick={closeFilePreview} className="close-btn">×</button>
                </div>
                <div className="preview-content">
                  {fileContent.contentType && fileContent.contentType.startsWith('image/') ? (
                    <img src={fileContent.url} alt={fileContent.name} />
                  ) : fileContent.contentType && (fileContent.contentType.startsWith('text/') || 
                       fileContent.contentType === 'application/json') ? (
                    <iframe src={fileContent.url} title={fileContent.name}></iframe>
                  ) : fileContent.contentType && fileContent.contentType.startsWith('video/') ? (
                    <video controls src={fileContent.url}></video>
                  ) : fileContent.contentType && fileContent.contentType.startsWith('audio/') ? (
                    <audio controls src={fileContent.url}></audio>
                  ) : (
                    <div className="download-prompt">
                      <p>This file type ({fileContent.contentType}) cannot be previewed.</p>
                      <button 
                        className="download-button" 
                        onClick={handleDownload}
                      >
                        Download {fileContent.name}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// Helper function to format file size
function formatFileSize(bytes) {
  // Ensure bytes is a number, not a BigInt
  const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  if (size < 1024) return size + ' bytes';
  else if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
  else if (size < 1073741824) return (size / 1048576).toFixed(1) + ' MB';
  else return (size / 1073741824).toFixed(1) + ' GB';
}

export default App;
