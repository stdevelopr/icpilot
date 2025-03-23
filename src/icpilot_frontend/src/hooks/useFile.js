import { useState, useCallback } from 'react';
import { icpilot_backend } from 'declarations/icpilot_backend';
import { convertBigIntValues } from '../utils';

export function useFile() {
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      const userFiles = await icpilot_backend.getMyFiles();
      setFiles(convertBigIntValues(userFiles));
    } catch (error) {
      console.error("Error fetching files:", error);
      setMessage({ type: 'error', text: `Error fetching files: ${error.message}` });
    }
  }, []);

  const uploadFile = useCallback(async (file, customFileName) => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Read the file as an ArrayBuffer
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(fileReader.result);
          
          // Get the file path, preserving directory structure
          const filePath = file.webkitRelativePath || customFileName || file.name;
          
          // Upload the file
          const result = await icpilot_backend.uploadFile(
            filePath,
            file.type || 'application/octet-stream',
            [...uint8Array]
          );
          
          if ("ok" in result) {
            setMessage({ type: 'success', text: `Successfully uploaded file: ${customFileName || file.name}` });
            fetchFiles();
          } else {
            setMessage({ type: 'error', text: `Failed to upload file: ${result.err}` });
          }
        } catch (error) {
          console.error("Error in file upload:", error);
          setMessage({ type: 'error', text: `Error uploading file: ${error.message}` });
        } finally {
          setLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        setMessage({ type: 'error', text: 'Error reading file' });
        setLoading(false);
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setLoading(false);
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (fileId) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [fetchFiles]);

  const viewFile = useCallback(async (fileId) => {
    try {
      setLoading(true);
      
      // First get the file metadata to ensure we have the correct information
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        setMessage({ type: 'error', text: 'File not found in your files list' });
        setLoading(false);
        return;
      }
      
      const content = await icpilot_backend.getFileContent(fileId);
      
      if (content) {
        // Use the metadata from our files state which is already processed
        const processedMetadata = file.metadata;
        
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
        
        // Create a Uint8Array from the extracted bytes
        const uint8Array = new Uint8Array(bytes);
        
        // Create a blob with the content type
        const blob = new Blob([uint8Array], { type: contentType });
        
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
      setLoading(false);
    }
  }, [files]);

  const closeFilePreview = useCallback(() => {
    if (fileContent && fileContent.url) {
      URL.revokeObjectURL(fileContent.url);
    }
    setFileContent(null);
  }, [fileContent]);

  const downloadFile = useCallback(() => {
    if (fileContent && fileContent.blob) {
      try {
        // Find the file in our files array to get the correct name
        const file = files.find(f => f.id === fileContent.fileId);
        const fileName = file ? file.metadata.name : fileContent.name || 'download.file';
        
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
  }, [fileContent, files]);

  return {
    files,
    fileContent,
    loading,
    message,
    fetchFiles,
    uploadFile,
    deleteFile,
    viewFile,
    closeFilePreview,
    downloadFile,
    setMessage
  };
}