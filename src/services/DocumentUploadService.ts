import { supabase } from '@/integrations/supabase/client';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  document_id?: string;
}

export interface FilePreview {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  document_id?: string;
}

export class DocumentUploadService {
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  /**
   * Upload multiple files with progress tracking
   */
  async uploadFiles(
    files: File[],
    projectId: string,
    userId: string,
    options: {
      category?: string;
      visibility?: 'project' | 'private' | 'public';
      onProgress?: (fileId: string, progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadProgress[]> {
    const { category = 'general', visibility = 'project', onProgress } = options;
    const uploadPromises: Promise<UploadProgress>[] = [];

    for (const file of files) {
      const fileId = this.generateFileId(file);
      
      if (onProgress) {
        this.progressCallbacks.set(fileId, onProgress);
      }

      uploadPromises.push(this.uploadSingleFile(file, fileId, projectId, userId, {
        category,
        visibility
      }));
    }

    return Promise.all(uploadPromises);
  }

  /**
   * Upload a single file with progress tracking
   */
  private async uploadSingleFile(
    file: File,
    fileId: string,
    projectId: string,
    userId: string,
    options: { category: string; visibility: string }
  ): Promise<UploadProgress> {
    const progressCallback = this.progressCallbacks.get(fileId);
    
    const updateProgress = (progress: Partial<UploadProgress>) => {
      const fullProgress: UploadProgress = {
        file,
        progress: 0,
        status: 'pending',
        ...progress
      };
      
      if (progressCallback) {
        progressCallback(fileId, fullProgress);
      }
      
      return fullProgress;
    };

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return updateProgress({
          status: 'error',
          error: validation.error
        });
      }

      updateProgress({ status: 'uploading', progress: 0 });

      // Generate unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `documents/${projectId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            updateProgress({ 
              status: 'uploading', 
              progress: percentage 
            });
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record in database
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          file_extension: fileExtension,
          project_id: projectId,
          uploaded_by: userId,
          category: options.category,
          visibility_scope: options.visibility,
          status: 'For Information'
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Generate thumbnail for images
      let thumbnail;
      if (file.type.startsWith('image/')) {
        thumbnail = await this.generateThumbnail(file);
      }

      return updateProgress({
        status: 'completed',
        progress: 100,
        url: urlData.publicUrl,
        document_id: documentData.id
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      return updateProgress({
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      this.progressCallbacks.delete(fileId);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} is not supported` 
      };
    }

    return { valid: true };
  }

  /**
   * Generate thumbnail for image files
   */
  private async generateThumbnail(file: File): Promise<string | undefined> {
    if (!file.type.startsWith('image/')) return undefined;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set thumbnail size
        const maxWidth = 200;
        const maxHeight = 200;
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailDataUrl);
      };

      img.onerror = () => resolve(undefined);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file preview
   */
  async getFilePreview(documentId: string): Promise<FilePreview | null> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      // Get signed URL for private files
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(document.file_path);

      return {
        id: document.id,
        name: document.name,
        type: document.file_type,
        size: document.file_size,
        url: urlData.publicUrl,
        document_id: documentId
      };
    } catch (error) {
      console.error('Error getting file preview:', error);
      return null;
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(documentId: string): Promise<boolean> {
    try {
      // Get document info
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): string[] {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv'
    ];
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(7)}`;
  }
}