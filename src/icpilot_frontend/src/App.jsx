import { useState, useEffect } from 'react';
import { icpilot_backend } from 'declarations/icpilot_backend';
import { convertBigIntValues } from './utils';
import Message from './components/UI/Message';
import Tabs from './components/UI/Tabs';
import FileTree from './components/File/FileTree';
import FileUploadForm from './components/File/FileUploadForm';
import FilePreview from './components/File/FilePreview';
import CanisterList from './components/Canister/CanisterList';

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

      console.log("Raw files:", userFiles); // Log raw response for debugging
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
        setMessage({ type: 'success', text: `Successfully created canister: ${result.ok}` });
        fetchCanisters();
      } else {
        setMessage({ type: 'error', text: `Failed to create canister: ${result.err}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event) {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select files to upload' });
      return;
    }

    // Handle multiple files from directory upload
    const files = Array.from(selectedFile);
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'No files selected' });
      return;
    }

    setFileLoading(true);
    setMessage(null);

    try {
      let successCount = 0;
      let failureCount = 0;

      for (const file of files) {
        try {
          // Create a new FileReader for each file
          const fileReader = new FileReader();
          
          // Convert the file reading to a Promise
          const arrayBuffer = await new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = () => reject(new Error('Error reading file'));
            fileReader.readAsArrayBuffer(file);
          });

          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Get the relative path if it exists (for directory upload)
          const filePath = file.webkitRelativePath || file.name;
          
          // Upload the file
          const result = await icpilot_backend.uploadFile(
            filePath,
            file.type || 'application/octet-stream',
            [...uint8Array]
          );
          
          if ("ok" in result) {
            successCount++;
          } else {
            failureCount++;
            console.error(`Failed to upload ${filePath}:`, result.err);
          }
        } catch (error) {
          failureCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Update UI with final status
      if (successCount > 0) {
        setMessage({
          type: failureCount === 0 ? 'success' : 'warning',
          text: `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}`+
                (failureCount > 0 ? `, ${failureCount} failed` : '')
        });
        fetchFiles();
      } else {
        setMessage({ type: 'error', text: 'All uploads failed' });
      }
      
      // Reset form
      setSelectedFile(null);
      setFileName('');
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
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files);
      setMessage(null); // Clear any previous error messages
      console.log(`Selected ${files.length} file(s) for upload`);
      // Update UI to show number of files selected
      setMessage({
        type: 'info',
        text: `${files.length} file${files.length > 1 ? 's' : ''} selected for upload`
      });
    } else {
      setSelectedFile(null);
      setMessage({ type: 'error', text: 'No files selected' });
    }
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

  const tabConfig = [
    { id: 'canisters', label: 'Canister Management' },
    { id: 'files', label: 'File Management' }
  ];

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      
      <Message type={message?.type} text={message?.text} />

      <Tabs 
        tabs={tabConfig} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'canisters' && (
        <div className="tab-section">
          <h2>Canister Management</h2>
          <div className="manager-toggle">
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Canister'}
            </button>
          </div>

          <CanisterList canisters={canisters} />
        </div>
      )}

      {activeTab === 'files' && (
        <div className="tab-section">
          <h2>File Management</h2>
          
          <FileUploadForm 
            onSubmit={handleFileUpload}
            onFileSelect={handleFileSelect}
            onFileNameChange={(e) => setFileName(e.target.value)}
            fileName={fileName}
            selectedFile={selectedFile}
            isLoading={fileLoading}
          />

          {files.length > 0 ? (
            <FileTree
              files={files}
              onView={handleViewFile}
              onDelete={handleFileDelete}
              isLoading={fileLoading}
            />
          ) : (
            <div className="no-files">
              <p>You haven't uploaded any files yet.</p>
            </div>
          )}

          {fileContent && (
            <FilePreview 
              fileContent={fileContent}
              onClose={closeFilePreview}
              onDownload={handleDownload}
            />
          )}
        </div>
      )}
    </main>
  );
}

export default App;
