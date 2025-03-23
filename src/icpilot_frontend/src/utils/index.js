/**
 * Recursively converts BigInt values to numbers or strings in an object
 * @param {Object} obj - The object to process
 * @returns {Object} - A new object with BigInt values converted
 */
export function convertBigIntValues(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    // Convert BigInt to Number if it's within safe integer range
    if (obj <= Number.MAX_SAFE_INTEGER && obj >= Number.MIN_SAFE_INTEGER) {
      return Number(obj);
    }
    // Otherwise convert to string to preserve value
    return obj.toString();
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntValues(item));
  }
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = convertBigIntValues(obj[key]);
    }
  }
  
  return result;
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} - Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  // Ensure bytes is a number, not a BigInt
  const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  if (size < 1024) return size + ' bytes';
  else if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
  else if (size < 1073741824) return (size / 1048576).toFixed(1) + ' MB';
  else return (size / 1073741824).toFixed(1) + ' GB';
}