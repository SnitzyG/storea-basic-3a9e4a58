// Production-grade document utility functions

import { Document } from '@/hooks/useDocuments';

/**
 * Extract file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  if (!fileName || !fileName.includes('.')) return '';
  const parts = fileName.split('.');
  return parts[parts.length - 1].toLowerCase().trim();
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (extension: string): string => {
  const ext = extension.toLowerCase();
  
  const mimeMap: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    heic: 'image/heic',
    heif: 'image/heif',
    ico: 'image/x-icon',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    
    // Text files
    txt: 'text/plain',
    csv: 'text/csv',
    rtf: 'application/rtf',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // CAD/Engineering
    dwg: 'application/acad',
    dxf: 'application/dxf',
    
    // Audio/Video
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wav: 'audio/wav',
  };
  
  return mimeMap[ext] || 'application/octet-stream';
};

/**
 * Resolve the best MIME type from File object and extension
 */
export const resolveMimeType = (file: File): string => {
  const fileExt = getFileExtension(file.name);
  const fileMime = file.type?.trim();
  
  // If browser provided a specific MIME type that's not generic, use it
  if (fileMime && 
      fileMime !== 'application/octet-stream' && 
      fileMime !== 'binary/octet-stream' && 
      fileMime !== '' &&
      !fileMime.includes('application/x-')) {
    return fileMime;
  }
  
  // Otherwise, resolve from extension
  return getMimeType(fileExt);
};

/**
 * Get safe filename for downloads
 */
export const getSafeFilename = (document: Document): string => {
  // Prefer document.name if it has an extension
  if (document.name && document.name.includes('.')) {
    return document.name;
  }
  
  // Fallback: combine title/name with extension
  const baseName = document.title || document.name || 'document';
  const extension = document.file_extension || getFileExtension(document.file_path || '');
  
  if (extension) {
    // Avoid duplicate extensions
    if (baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
      return baseName;
    }
    return `${baseName}.${extension}`;
  }
  
  return baseName;
};

/**
 * Get clean display name for file type
 */
export const getFileTypeDisplayName = (document: Document): string => {
  const ext = document.file_extension?.toLowerCase() || getFileExtension(document.name || '');
  
  const displayNames: Record<string, string> = {
    png: 'PNG',
    jpg: 'JPG', 
    jpeg: 'JPEG',
    gif: 'GIF',
    pdf: 'PDF',
    doc: 'DOC',
    docx: 'DOCX',
    xls: 'XLS',
    xlsx: 'XLSX',
    ppt: 'PPT',
    pptx: 'PPTX',
    txt: 'TXT',
    csv: 'CSV',
    zip: 'ZIP',
    rar: 'RAR',
    dwg: 'DWG',
    dxf: 'DXF',
    mp3: 'MP3',
    mp4: 'MP4',
    heic: 'HEIC',
    svg: 'SVG',
    webp: 'WEBP',
    bmp: 'BMP',
    odt: 'ODT',
    ods: 'ODS',
    odp: 'ODP',
  };
  
  return displayNames[ext] || ext.toUpperCase() || 'FILE';
};

/**
 * Check if file type can be previewed inline
 */
export const canPreviewFile = (fileType: string, fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint'
  ];
  
  const previewableExtensions = [
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'txt', 'csv',
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
  ];
  
  return previewableTypes.includes(fileType) || previewableExtensions.includes(extension);
};

/**
 * Get file category based on extension
 */
export const getFileCategory = (extension: string): string => {
  const ext = extension.toLowerCase();
  
  const categoryMap: Record<string, string> = {
    'pdf': 'contracts',
    'doc': 'specifications',
    'docx': 'specifications',
    'dwg': 'architectural_drawings',
    'dxf': 'architectural_drawings',
    'jpg': 'photographs',
    'jpeg': 'photographs',
    'png': 'photographs',
    'gif': 'photographs',
    'xlsx': 'reports',
    'xls': 'reports',
    'txt': 'correspondence',
    'csv': 'reports',
    'zip': 'permits',
    'rar': 'permits'
  };
  
  return categoryMap[ext] || 'general';
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate a storage-safe filename
 */
export const generateStorageFilename = (originalName: string, projectId: string): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  
  if (extension) {
    return `${projectId}/${timestamp}-${randomId}.${extension}`;
  }
  
  return `${projectId}/${timestamp}-${randomId}`;
};
