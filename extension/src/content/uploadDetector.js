/**
 * Upload Detector for SafeLens Content Script
 * 
 * Responsibility:
 * - Parses and extracts files from file selections, drag-and-drop, and paste events.
 * - Filters for supported image formats.
 * - Extracts metadata (filename, size, mime type) without performing binary analysis.
 * - Forwards validated images to the Upload Interceptor.
 * 
 * Interacts with:
 * - extension/src/content/domObserver.js (Provides events containing files)
 * - extension/src/content/uploadInterceptor.js (Receives validated files for pausing/scan lifecycle)
 */

// Supported image types for the privacy scanner
const SUPPORTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]);

/**
 * Metadata representation of a detected file.
 * @typedef {Object} FileMetadata
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {string} type - File MIME type
 * @property {number} lastModified - Last modified timestamp
 */

/**
 * Extract files and run detection logic on a selected list of files.
 * 
 * @param {FileList|File[]} fileList - List of files to process
 * @param {HTMLElement} targetElement - DOM element that received the upload
 * @param {Function} onApprovalCallback - Callback function to re-trigger upload with approved files
 * @param {Object} uploadInterceptor - Reference to the uploadInterceptor instance
 */
export function detectAndProcessFiles(fileList, targetElement, onApprovalCallback, uploadInterceptor) {
  if (!fileList || fileList.length === 0) {
    return;
  }

  const filesArray = Array.from(fileList);
  const imageFiles = [];
  const imageMetadata = [];

  for (const file of filesArray) {
    if (SUPPORTED_MIME_TYPES.has(file.type)) {
      imageFiles.push(file);
      imageMetadata.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    } else {
      console.log(`[UploadDetector] Ignoring unsupported file type: ${file.type} (${file.name})`);
    }
  }

  // If we found image files, intercept them. Otherwise, let them pass or invoke standard upload.
  if (imageFiles.length > 0) {
    console.log(`[UploadDetector] Detected ${imageFiles.length} image(s) for scanning:`, imageMetadata);
    
    // Delegate to the interceptor to coordinate verification/redaction
    uploadInterceptor.interceptUpload(imageFiles, imageMetadata, targetElement, onApprovalCallback);
  } else {
    // If no images were found but other files were, trigger the upload immediately with the original files
    console.log('[UploadDetector] No image files detected. Proceeding with standard file upload.');
    onApprovalCallback(fileList);
  }
}
