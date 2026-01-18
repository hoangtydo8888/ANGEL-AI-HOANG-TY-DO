import { useState, useEffect } from 'react';
import { Upload, Download, FileText, Trash2, Search, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useR2Upload } from '@/hooks/useR2Upload';
import { motion, AnimatePresence } from 'framer-motion';

interface KnowledgeFile {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  download_count: number;
  created_at: string;
  user_id: string | null;
}

export const KnowledgeBase = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { uploadToR2, isUploading } = useR2Upload();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('knowledge_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return;
    }

    setFiles(data || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['text/plain', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Định dạng không hợp lệ",
          description: "Con yêu dấu, chỉ chấp nhận file TXT hoặc PDF thôi nha!",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File quá lớn",
          description: "Con yêu, file không được vượt quá 10MB nha!",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Con yêu dấu, hãy điền đầy đủ tiêu đề và chọn file nha!",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Chưa đăng nhập",
          description: "Con yêu cần đăng nhập để upload kiến thức nha!",
          variant: "destructive"
        });
        return;
      }

      // Upload to R2 instead of Supabase Storage
      const result = await uploadToR2(selectedFile, 'knowledge');
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      const { error: dbError } = await supabase
        .from('knowledge_files')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          file_name: selectedFile.name,
          file_path: result.url || '', // Store R2 public URL
          file_type: selectedFile.type,
          file_size: selectedFile.size
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Upload thành công! ✨",
        description: "Angel AI đã tiếp nhận kiến thức mới rồi, con yêu dấu!"
      });

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowUploadForm(false);
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi upload",
        description: "Có lỗi xảy ra, con thử lại nha!",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (file: KnowledgeFile) => {
    try {
      // Check if file is on R2 (starts with http) or old Supabase storage
      const isR2File = file.file_path.startsWith('http');
      
      let downloadUrl: string;
      
      if (isR2File) {
        // R2 file - use direct URL
        downloadUrl = file.file_path;
      } else {
        // Old Supabase storage file
        const { data, error } = await supabase.storage
          .from('knowledge')
          .download(file.file_path);

        if (error) throw error;
        downloadUrl = URL.createObjectURL(data);
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.file_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Only revoke if it's a blob URL (old Supabase files)
      if (!isR2File) {
        URL.revokeObjectURL(downloadUrl);
      }

      // Update download count
      await supabase
        .from('knowledge_files')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', file.id);

      fetchFiles();

      toast({
        title: "Tải xuống thành công! 📥",
        description: `Đã tải "${file.title}" về thiết bị của con!`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Lỗi tải xuống",
        description: "Có lỗi xảy ra khi tải file!",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (file: KnowledgeFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== file.user_id) {
        toast({
          title: "Không có quyền",
          description: "Con chỉ có thể xóa file của chính mình thôi nha!",
          variant: "destructive"
        });
        return;
      }

      // Only delete from Supabase storage if it's an old file (not R2)
      const isR2File = file.file_path.startsWith('http');
      if (!isR2File) {
        await supabase.storage
          .from('knowledge')
          .remove([file.file_path]);
      }
      // Note: R2 files would need a separate delete API call if needed

      await supabase
        .from('knowledge_files')
        .delete()
        .eq('id', file.id);

      toast({
        title: "Đã xóa! 🗑️",
        description: "File đã được xóa thành công!"
      });

      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Lỗi xóa file",
        description: "Có lỗi xảy ra khi xóa file!",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sacred-turquoise to-sacred-turquoise-glow flex items-center justify-center shadow-divine">
            <BookOpen className="w-8 h-8 text-divine-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-divine-gold drop-shadow-divine-gold">
              Kho Kiến Thức Vũ Trụ
            </h1>
            <p className="text-xl text-divine-gold/80">
              Nơi lưu trữ trí tuệ thiêng liêng của Cha
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-gradient-to-r from-sacred-turquoise to-sacred-turquoise-glow text-divine-gold font-bold text-lg px-6 py-3 rounded-full shadow-divine hover:shadow-divine-hover transition-all duration-300"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Kiến Thức
        </Button>
      </div>

      {/* Upload Form */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 rounded-3xl bg-white/80 backdrop-blur-sm border-2 border-sacred-turquoise/30 shadow-divine"
          >
            <h3 className="text-2xl font-bold text-divine-gold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Thêm Kiến Thức Mới
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-divine-gold mb-2">
                  Tiêu đề *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề kiến thức..."
                  className="text-lg border-sacred-turquoise/50 focus:border-sacred-turquoise bg-white/90"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-divine-gold mb-2">
                  Mô tả
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về nội dung..."
                  className="text-lg border-sacred-turquoise/50 focus:border-sacred-turquoise bg-white/90"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-divine-gold mb-2">
                  File (TXT hoặc PDF) *
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-sacred-turquoise/50 rounded-2xl cursor-pointer hover:border-sacred-turquoise hover:bg-sacred-turquoise/10 transition-all">
                    <FileText className="w-6 h-6 text-sacred-turquoise" />
                    <span className="text-lg text-divine-gold/80">
                      {selectedFile ? selectedFile.name : 'Chọn file...'}
                    </span>
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !title.trim()}
                  className="flex-1 bg-gradient-to-r from-divine-gold to-divine-gold-light text-white font-bold text-lg py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {isUploading ? 'Đang upload...' : 'Xác nhận Upload ✨'}
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadForm(false);
                    setTitle('');
                    setDescription('');
                    setSelectedFile(null);
                  }}
                  variant="outline"
                  className="px-6 border-sacred-turquoise/50 text-divine-gold hover:bg-sacred-turquoise/10"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-sacred-turquoise" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm kiến thức..."
          className="pl-12 text-lg py-4 border-sacred-turquoise/50 focus:border-sacred-turquoise bg-white/90 rounded-full"
        />
      </div>

      {/* Files Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-3xl bg-white/90 backdrop-blur-sm border-2 border-sacred-turquoise/30 shadow-divine hover:shadow-divine-hover hover:border-sacred-turquoise/50 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sacred-turquoise/20 to-sacred-turquoise-glow/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-sacred-turquoise" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-divine-gold truncate">
                    {file.title}
                  </h3>
                  <p className="text-sm text-divine-gold/60">
                    {file.file_type === 'application/pdf' ? 'PDF' : 'TXT'} • {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>

              {file.description && (
                <p className="text-divine-gold/70 mb-4 line-clamp-2">
                  {file.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-divine-gold/50 mb-4">
                <span>📥 {file.download_count} lượt tải</span>
                <span>{new Date(file.created_at).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(file)}
                  className="flex-1 bg-gradient-to-r from-sacred-turquoise to-sacred-turquoise-glow text-divine-gold font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Tải xuống
                </Button>
                <Button
                  onClick={() => handleDelete(file)}
                  variant="outline"
                  className="px-4 border-red-300 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sacred-turquoise/20 to-sacred-turquoise-glow/20 flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-sacred-turquoise" />
          </div>
          <h3 className="text-2xl font-bold text-divine-gold mb-2">
            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có kiến thức nào'}
          </h3>
          <p className="text-lg text-divine-gold/60">
            {searchQuery
              ? 'Thử tìm kiếm với từ khóa khác nha con yêu!'
              : 'Hãy upload kiến thức đầu tiên của Cha nha!'}
          </p>
        </div>
      )}
    </div>
  );
};
