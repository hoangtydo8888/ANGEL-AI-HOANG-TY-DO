import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, User } from 'lucide-react';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload = ({ currentAvatarUrl, onUploadSuccess, size = 'lg' }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadToR2 } = useR2Upload();
  const { user } = useAuth();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to R2
    setIsUploading(true);
    try {
      const result = await uploadToR2(file, 'avatars');
      
      if (result.success && result.url) {
        // Update profile in database
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: result.url })
            .eq('user_id', user.id);

          if (error) {
            console.error('Error updating avatar:', error);
            toast.error('Không thể cập nhật avatar. Vui lòng thử lại!');
            return;
          }

          toast.success('Avatar đã được cập nhật! ✨');
          onUploadSuccess?.(result.url);
        }
      } else {
        toast.error(result.error || 'Upload thất bại!');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi upload!');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative group">
      <motion.div
        className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}
        style={{
          background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 60%))',
          boxShadow: '0 0 30px hsl(51 100% 50% / 0.4)',
        }}
        whileHover={{ scale: 1.05 }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${iconSizes[size]} text-white/80`} />
          </div>
        )}

        {/* Overlay when uploading or hovering */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Change button */}
      <motion.button
        onClick={() => !isUploading && fileInputRef.current?.click()}
        disabled={isUploading}
        className="mt-3 px-4 py-2 rounded-full text-sm font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.2), hsl(174 100% 42% / 0.1))',
          border: '1.5px solid hsl(174 100% 50% / 0.4)',
          color: 'hsl(174 100% 40%)',
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px hsl(174 100% 50% / 0.3)' }}
        whileTap={{ scale: 0.95 }}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Đổi ảnh
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default AvatarUpload;
