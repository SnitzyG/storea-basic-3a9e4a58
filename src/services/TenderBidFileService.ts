import { supabase } from '@/integrations/supabase/client';
import { downloadFromStorage } from '@/utils/storageUtils';

const BID_FILES_BUCKET = 'documents'; // Reusing existing documents bucket

export class TenderBidFileService {
  /**
   * Upload bid Excel file to storage
   */
  static async uploadBidExcel(
    tenderId: string,
    bidId: string,
    file: File
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name}`;
    const filePath = `tenders/${tenderId}/bids/${bidId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BID_FILES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    return filePath;
  }

  /**
   * Download bid Excel file from storage
   */
  static async downloadBidExcel(filePath: string, fileName: string): Promise<void> {
    await downloadFromStorage(filePath, fileName);
  }

  /**
   * Delete bid file from storage
   */
  static async deleteBidFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BID_FILES_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get public URL for bid file (if needed for preview)
   */
  static async getFileUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from(BID_FILES_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (!data?.signedUrl) {
      throw new Error('Failed to get file URL');
    }

    return data.signedUrl;
  }
}
