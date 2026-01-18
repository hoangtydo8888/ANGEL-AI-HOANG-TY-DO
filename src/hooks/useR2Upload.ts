import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  size?: number;
  type?: string;
  error?: string;
}

export const useR2Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadToR2 = async (file: File, folder: string = 'uploads'): Promise<UploadResult> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const { data, error } = await supabase.functions.invoke('upload-to-r2', {
        body: formData,
      });

      if (error) {
        console.error('R2 upload error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Upload failed' };
      }

      return {
        success: true,
        url: data.url,
        fileName: data.fileName,
        size: data.size,
        type: data.type,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Upload error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  const uploadWithToast = async (file: File, folder: string = 'uploads'): Promise<UploadResult> => {
    const result = await uploadToR2(file, folder);

    if (result.success) {
      toast({
        title: "Upload thành công! ✨",
        description: "File đã được tải lên R2 thành công!",
      });
    } else {
      toast({
        title: "Lỗi upload",
        description: result.error || "Có lỗi xảy ra khi tải file lên!",
        variant: "destructive",
      });
    }

    return result;
  };

  return {
    uploadToR2,
    uploadWithToast,
    isUploading,
  };
};
