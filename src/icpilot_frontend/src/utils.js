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
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntValues(item));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      // Special handling for controllers array - preserve full principal strings
      if (key === 'controllers' && Array.isArray(obj[key])) {
        result[key] = obj[key].map(controller => {
          // Convert principal objects to full strings without truncation
          if (controller && typeof controller === 'object' && controller.toString) {
            return controller.toString();
          }
          return controller;
        });
      } else {
        result[key] = convertBigIntValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Formats a cycles amount into a human-readable string
 * @param {BigInt|Number|null} cycles - The amount of cycles
 * @returns {String} Formatted cycles string
 */
export function formatCycles(cycles) {
  if (cycles === null) return "Error fetching cycles";
  if (cycles === undefined) return "Unknown";
  
  // Convert to number if it's a BigInt
  const cyclesNum = typeof cycles === 'bigint' ? Number(cycles) : cycles;
  
  // Format based on size
  if (cyclesNum >= 1_000_000_000_000) {
    return `${(cyclesNum / 1_000_000_000_000).toFixed(2)} T`;
  } else if (cyclesNum >= 1_000_000_000) {
    return `${(cyclesNum / 1_000_000_000).toFixed(2)} B`;
  } else if (cyclesNum >= 1_000_000) {
    return `${(cyclesNum / 1_000_000).toFixed(2)} M`;
  } else if (cyclesNum >= 1_000) {
    return `${(cyclesNum / 1_000).toFixed(2)} K`;
  } else {
    return cyclesNum.toString();
  }
}

/**
 * Formats memory size in bytes to a human-readable string
 * @param {BigInt|Number|null} bytes - The memory size in bytes
 * @returns {String} Formatted memory size string
 */
export function formatMemorySize(bytes) {
  if (bytes === null) return "Error fetching memory size";
  if (bytes === undefined) return "Unknown";
  
  // Convert to number if it's a BigInt
  const bytesNum = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  // Format based on size
  if (bytesNum >= 1_073_741_824) { // 1 GB
    return `${(bytesNum / 1_073_741_824).toFixed(2)} GB`;
  } else if (bytesNum >= 1_048_576) { // 1 MB
    return `${(bytesNum / 1_048_576).toFixed(2)} MB`;
  } else if (bytesNum >= 1_024) { // 1 KB
    return `${(bytesNum / 1_024).toFixed(2)} KB`;
  } else {
    return `${bytesNum} bytes`;
  }
}

/**
 * Formats canister status information into a human-readable object
 * @param {Object} statusInfo - The canister status information
 * @returns {Object} Formatted status information
 */
export function formatCanisterStatus(statusInfo) {
  if (!statusInfo) return { status: "Unknown" };
  
  return {
    status: statusInfo.status || "Unknown",
    memory: formatMemorySize(statusInfo.memory_size),
    cycles: formatCycles(statusInfo.cycles),
    freezingThreshold: formatCycles(statusInfo.freezing_threshold),
    idleBurnRate: `${formatCycles(statusInfo.idle_cycles_burned_per_day)}/day`,
    moduleHash: statusInfo.module_hash ? 
      `${statusInfo.module_hash.slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('')}...` : 
      "No hash available",
    controllers: statusInfo.controllers || [] // Add controllers
  };
}