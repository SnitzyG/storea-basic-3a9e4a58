// Production-grade document utility functions with bulletproof MIME/extension handling


import { Document } from '@/hooks/useDocuments';

/**
 * Extract file extension from filename or path (bulletproof)
 */
export const getFileExtension = (nameOrPath: string): string => {
  if (!nameOrPath) return 'bin';
  const clean = nameOrPath.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase().trim() : '';
  return ext || 'bin';
};

/**
 * Get MIME type from file extension using mime-types (bulletproof)
 */
export const getMimeType = (extension: string): string => {
  const ext = (extension || '').toLowerCase().trim();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    sevenz: 'application/x-7z-compressed',
    heic: 'image/heic',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    dwg: 'image/vnd.dwg',
    dxf: 'image/vnd.dxf',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
  };
  return map[ext] || 'application/octet-stream';
};

/**
 * Get safe MIME type from document (bulletproof)
 */
export const getSafeMime = (doc: { 
  file_type?: string; 
  file_extension?: string; 
  name?: string; 
  file_path?: string; 
}): string => {
  const ext = (doc.file_extension || getFileExtension(doc.name || doc.file_path || '')).toLowerCase();
  const fromDb = (doc.file_type || '').trim();
  return fromDb || getMimeType(ext);
};

/**
 * Get safe filename for downloads (bulletproof)
 */
export const getSafeFilename = (document: { 
  name?: string; 
  title?: string; 
  file_extension?: string; 
}): string => {
  // Prefer provided name if it has an extension
  if (document.name && document.name.includes('.')) {
    return document.name;
  }
  const base = (document.title || document.name || 'document').trim();
  const ext = (document.file_extension || '').toLowerCase();
  if (!ext) return base; // unknown, caller may append .bin
  // avoid duplicate extensions
  if (base.toLowerCase().endsWith(`.${ext}`)) return base;
  return `${base}.${ext}`;
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
