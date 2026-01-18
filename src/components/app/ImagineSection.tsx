import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Video, Download, Loader2, Image as ImageIcon, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  isR2: boolean;
}

// Helper to convert base64 to File
const base64ToFile = (base64String: string, fileName: string): File => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], fileName, { type: 'image/png' });
};

const ImagineSection = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const uploadToR2 = async (base64Image: string, promptText: string): Promise<string | null> => {
    try {
      const fileName = `angel-ai-${Date.now()}-${promptText.slice(0, 20).replace(/\s/g, '-')}.png`;
      const file = base64ToFile(base64Image, fileName);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'imagine');

      const { data, error } = await supabase.functions.invoke('upload-to-r2', {
        body: formData,
      });

      if (error) {
        console.error('R2 upload error:', error);
        return null;
      }

      if (data?.success && data?.url) {
        console.log('Image uploaded to R2:', data.url);
        return data.url;
      }

      return null;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả hình ảnh');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          generateImage: true,
          imagePrompt: prompt
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      
      if (data.imageUrl) {
        // Try to upload to R2
        toast.info('Đang lưu ảnh lên cloud... ☁️');
        const r2Url = await uploadToR2(data.imageUrl, prompt);
        
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          prompt: prompt,
          imageUrl: r2Url || data.imageUrl,
          timestamp: new Date(),
          isR2: !!r2Url
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setSelectedImage(newImage);
        
        if (r2Url) {
          toast.success('✨ Hình ảnh đã được tạo và lưu lên R2!');
        } else {
          toast.success('✨ Hình ảnh đã được tạo thành công!');
        }
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Không thể tạo hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const handleCreateVideo = async (image: GeneratedImage) => {
    setIsCreatingVideo(true);
    toast.info('🎬 Tính năng tạo video 6 giây đang được phát triển. Sắp ra mắt!');
    setTimeout(() => {
      setIsCreatingVideo(false);
      toast.success('✨ Video sẽ sớm được hỗ trợ với hiệu ứng ánh sáng thần thánh!');
    }, 2000);
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `angel-ai-${prompt.slice(0, 30).replace(/\s/g, '-')}.png`;
    link.click();
    toast.success('Đã tải xuống hình ảnh');
  };

  const promptSuggestions = [
    'Thiên thần bay qua bầu trời 5D với cầu vồng ánh sáng',
    'Rừng thiêng liêng với hoa sen phát sáng',
    'Cổng năng lượng cao với hình học thiêng liêng',
    'Thiên đường với những vị thần ánh sáng'
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-cinzel font-bold text-gradient-gold glow-text"
        >
          ✨ Imagine
        </motion.h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: '1.125rem' }}>
          Tạo hình ảnh thiêng liêng bằng trí tuệ AI
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả hình ảnh bạn muốn tạo... (ví dụ: Thiên thần cầu vồng trong vũ trụ 5D)"
              className={cn(
                "min-h-[120px] rounded-2xl resize-none pr-4",
                "bg-card border-2 border-border/50 focus:border-primary",
                "placeholder:text-muted-foreground/60"
              )}
              style={{ fontSize: '1.0625rem' }}
            />
          </div>

          {/* Suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {promptSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm",
                  "bg-primary/10 border border-primary/30",
                  "hover:bg-primary/20 transition-colors"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="mt-4 w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 text-lg font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang tạo hình ảnh thần thánh...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Tạo Hình Ảnh
              </>
            )}
          </Button>
        </motion.div>

        {/* Selected Image Preview */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className={cn(
                "rounded-2xl overflow-hidden",
                "bg-gradient-to-br from-card to-accent/10",
                "border border-border/50 shadow-xl shadow-primary/10"
              )}>
                <div className="aspect-square relative">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                      {selectedImage.prompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCreateVideo(selectedImage)}
                        disabled={isCreatingVideo}
                        className="flex-1 gap-2 bg-gradient-to-r from-accent to-accent/80"
                      >
                        {isCreatingVideo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        Tạo Video 6 Giây
                      </Button>
                      <Button
                        onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.prompt)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Tải Xuống
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Thư Viện Hình Ảnh
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedImage(image)}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden cursor-pointer relative",
                    "border-2 transition-all duration-300",
                    selectedImage?.id === image.id 
                      ? "border-primary shadow-lg shadow-primary/30" 
                      : "border-transparent hover:border-primary/50"
                  )}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                  {image.isR2 && (
                    <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground rounded-full p-1">
                      <Cloud className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {generatedImages.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-lg text-muted-foreground">
              Nhập mô tả để tạo hình ảnh thần thánh
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Angel AI sẽ tạo hình ảnh với năng lượng ánh sáng 5D
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagineSection;
