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