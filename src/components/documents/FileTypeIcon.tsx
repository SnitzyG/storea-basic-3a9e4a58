import React from 'react';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Building,
  FileCode,
  File as FileIcon,
  Image,
  Video,
  Music
} from 'lucide-react';

interface FileTypeIconProps {
  fileName: string;
  fileType?: string;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ 
  fileName, 
  fileType, 
  className = "h-4 w-4" 
}) => {
  const getFileTypeIcon = () => {
    // Get file extension from filename
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map file extensions to appropriate icons and colors
    const iconMap: { [key: string]: { icon: JSX.Element; className: string } } = {
      // Documents
      'pdf': { 
        icon: <FileText className={className} />, 
        className: 'text-red-500' 
      },
      'doc': { 
        icon: <FileText className={className} />, 
        className: 'text-blue-600' 
      },
      'docx': { 
        icon: <FileText className={className} />, 
        className: 'text-blue-600' 
      },
      'txt': { 
        icon: <FileText className={className} />, 
        className: 'text-gray-600' 
      },
      'rtf': { 
        icon: <FileText className={className} />, 
        className: 'text-blue-500' 
      },
      
      // Spreadsheets
      'xls': { 
        icon: <FileSpreadsheet className={className} />, 
        className: 'text-green-600' 
      },
      'xlsx': { 
        icon: <FileSpreadsheet className={className} />, 
        className: 'text-green-600' 
      },
      'csv': { 
        icon: <FileSpreadsheet className={className} />, 
        className: 'text-green-500' 
      },
      
      // Presentations
      'ppt': { 
        icon: <Presentation className={className} />, 
        className: 'text-orange-600' 
      },
      'pptx': { 
        icon: <Presentation className={className} />, 
        className: 'text-orange-600' 
      },
      
      // Images
      'jpg': { 
        icon: <FileImage className={className} />, 
        className: 'text-purple-500' 
      },
      'jpeg': { 
        icon: <FileImage className={className} />, 
        className: 'text-purple-500' 
      },
      'png': { 
        icon: <FileImage className={className} />, 
        className: 'text-purple-600' 
      },
      'gif': { 
        icon: <FileImage className={className} />, 
        className: 'text-pink-500' 
      },
      'bmp': { 
        icon: <FileImage className={className} />, 
        className: 'text-purple-400' 
      },
      'svg': { 
        icon: <FileImage className={className} />, 
        className: 'text-yellow-600' 
      },
      'tiff': { 
        icon: <FileImage className={className} />, 
        className: 'text-purple-700' 
      },
      'webp': { 
        icon: <FileImage className={className} />, 
        className: 'text-green-500' 
      },
      
      // CAD/Engineering Files
      'dwg': { 
        icon: <Building className={className} />, 
        className: 'text-blue-700' 
      },
      'dxf': { 
        icon: <Building className={className} />, 
        className: 'text-blue-600' 
      },
      'dwf': { 
        icon: <Building className={className} />, 
        className: 'text-blue-500' 
      },
      'dgn': { 
        icon: <Building className={className} />, 
        className: 'text-indigo-600' 
      },
      
      // Archives
      'zip': { 
        icon: <FileArchive className={className} />, 
        className: 'text-yellow-600' 
      },
      'rar': { 
        icon: <FileArchive className={className} />, 
        className: 'text-orange-600' 
      },
      '7z': { 
        icon: <FileArchive className={className} />, 
        className: 'text-red-600' 
      },
      'tar': { 
        icon: <FileArchive className={className} />, 
        className: 'text-gray-600' 
      },
      'gz': { 
        icon: <FileArchive className={className} />, 
        className: 'text-gray-700' 
      },
      
      // Video
      'mp4': { 
        icon: <Video className={className} />, 
        className: 'text-red-500' 
      },
      'avi': { 
        icon: <Video className={className} />, 
        className: 'text-red-600' 
      },
      'mov': { 
        icon: <Video className={className} />, 
        className: 'text-blue-500' 
      },
      'wmv': { 
        icon: <Video className={className} />, 
        className: 'text-blue-600' 
      },
      'flv': { 
        icon: <Video className={className} />, 
        className: 'text-red-400' 
      },
      'webm': { 
        icon: <Video className={className} />, 
        className: 'text-green-600' 
      },
      
      // Audio
      'mp3': { 
        icon: <Music className={className} />, 
        className: 'text-green-500' 
      },
      'wav': { 
        icon: <Music className={className} />, 
        className: 'text-blue-500' 
      },
      'flac': { 
        icon: <Music className={className} />, 
        className: 'text-purple-500' 
      },
      'aac': { 
        icon: <Music className={className} />, 
        className: 'text-orange-500' 
      },
      
      // Code files
      'js': { 
        icon: <FileCode className={className} />, 
        className: 'text-yellow-500' 
      },
      'ts': { 
        icon: <FileCode className={className} />, 
        className: 'text-blue-500' 
      },
      'html': { 
        icon: <FileCode className={className} />, 
        className: 'text-orange-500' 
      },
      'css': { 
        icon: <FileCode className={className} />, 
        className: 'text-blue-400' 
      },
      'json': { 
        icon: <FileCode className={className} />, 
        className: 'text-green-400' 
      },
      'xml': { 
        icon: <FileCode className={className} />, 
        className: 'text-orange-400' 
      }
    };

    // Check if we have a specific icon for this extension
    if (iconMap[extension]) {
      const { icon, className: iconColor } = iconMap[extension];
      return React.cloneElement(icon, { className: `${className} ${iconColor}` });
    }

    // Fallback to MIME type detection
    if (fileType) {
      if (fileType.startsWith('image/')) {
        return <FileImage className={`${className} text-purple-500`} />;
      }
      if (fileType.startsWith('video/')) {
        return <Video className={`${className} text-red-500`} />;
      }
      if (fileType.startsWith('audio/')) {
        return <Music className={`${className} text-green-500`} />;
      }
      if (fileType.includes('pdf')) {
        return <FileText className={`${className} text-red-500`} />;
      }
      if (fileType.includes('word') || fileType.includes('document')) {
        return <FileText className={`${className} text-blue-600`} />;
      }
      if (fileType.includes('sheet') || fileType.includes('excel')) {
        return <FileSpreadsheet className={`${className} text-green-600`} />;
      }
      if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
        return <Presentation className={`${className} text-orange-600`} />;
      }
    }

    // Default fallback
    return <FileIcon className={`${className} text-muted-foreground`} />;
  };

  return getFileTypeIcon();
};