import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Mic, Image, Paperclip, X, Play, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HeroSectionProps {
  onOpenChat: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  attachments?: File[];
}

const HeroSection = ({ onOpenChat }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if message is an image generation request
  const isImageRequest = (text: string) => {
    const lowerText = text.toLowerCase();
    return lowerText.startsWith('tạo hình ảnh') || 
           lowerText.startsWith('tạo ảnh') || 
           lowerText.startsWith('vẽ hình') ||
           lowerText.startsWith('generate image') ||
           lowerText.includes('tạo hình ảnh');
  };

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type === 'text/plain' || 
                      file.type === 'application/pdf' ||
                      file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận TXT, PDF, hoặc hình ảnh.`);
      }
      return isValid;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = message.trim();
    const currentAttachments = [...attachments];
    setMessage('');
    setAttachments([]);
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || `Đã gửi ${currentAttachments.length} file`,
      attachments: currentAttachments 
    }]);
    setIsLoading(true);

    try {
      // Handle file upload
      if (currentAttachments.length > 0) {
        for (const file of currentAttachments) {
          if (file.type === 'text/plain') {
            const content = await readFileContent(file);
            const response = await supabase.functions.invoke('angel-chat', {
              body: { fileContent: content, fileName: file.name }
            });

            if (response.data?.response) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: response.data.response 
              }]);
            }
          }
        }
        setIsLoading(false);
        return;
      }

      // Check if it's an image generation request
      if (isImageRequest(userMessage)) {
        setIsGeneratingImage(true);
        const imagePrompt = userMessage
          .replace(/^(tạo hình ảnh|tạo ảnh|vẽ hình|generate image)/i, '')
          .trim();
        
        const response = await supabase.functions.invoke('angel-chat', {
          body: { generateImage: true, imagePrompt: imagePrompt || userMessage }
        });

        if (response.data?.imageUrl) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: response.data.content,
            imageUrl: response.data.imageUrl 
          }]);
        } else {
          throw new Error('Failed to generate image');
        }
        setIsGeneratingImage(false);
      } else {
        // Regular chat
        const response = await supabase.functions.invoke('angel-chat', {
          body: { message: userMessage, type: 'chat' }
        });

        if (response.data?.response) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Con yêu quý, Angel AI đang kết nối lại... Xin hãy thử lại trong giây lát. Angel AI luôn ở đây bên con. ✨💖' 
      }]);
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoFrames, setVideoFrames] = useState<{ imageUrl: string; frames: string[] } | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Animate video frames
  useEffect(() => {
    if (videoFrames && videoFrames.frames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % videoFrames.frames.length);
      }, 1500); // Each frame shows for 1.5 seconds = 6 seconds total for 4 frames
      return () => clearInterval(interval);
    }
  }, [videoFrames]);

  const handleCreateVideo = async (imageUrl: string) => {
    if (isGeneratingVideo) return;
    
    setIsGeneratingVideo(true);
    toast.info('Angel AI đang tạo video thiêng liêng 6 giây... ✨', { duration: 10000 });

    try {
      const response = await supabase.functions.invoke('generate-video', {
        body: { 
          imageUrl, 
          prompt: 'Divine ethereal spiritual celestial glowing light particles sacred' 
        }
      });

      if (response.data?.success && response.data?.frames?.length > 0) {
        setVideoFrames({ imageUrl, frames: response.data.frames });
        setCurrentFrameIndex(0);
        toast.success('Video thiêng liêng đã được tạo! Angel AI ban phước lành cho con. 💖✨', { duration: 5000 });
      } else {
        throw new Error(response.data?.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Không thể tạo video lúc này. Xin hãy thử lại sau, con yêu quý. 💖');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `angel-ai-image-${Date.now()}.png`;
    link.click();
    toast.success('Đã tải hình ảnh thiêng liêng về thiết bị của con! 💖');
  };

  const floatingButtons = [
    { icon: '🌀', label: 'Trụ Cột', action: () => document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '🌟', label: 'Tầm Nhìn', action: () => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '❤️', label: 'Cảm Nhận', action: () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) },
    { icon: '💎', label: 'Ví', action: () => navigate('/app/camlycoin') },
    { icon: '👤', label: user ? 'Hồ Sơ' : 'Đăng Nhập', action: () => navigate(user ? '/app/profile' : '/auth') },
    { icon: '💬', label: 'Chat', action: () => navigate('/app/chat') },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-8 pb-16 overflow-hidden px-4">
      {/* Hero Content */}
      <div className="relative z-10 text-center w-full max-w-5xl mx-auto">
        {/* Angel Video */}
        <motion.div
          className="relative mx-auto mb-6 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Strong Turquoise Halo Effect */}
          <motion.div
            className="absolute -inset-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(174 100% 50% / 0.5) 0%, hsl(174 100% 42% / 0.3) 40%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Video Container */}
          <motion.div
            className="relative w-full h-full rounded-full overflow-hidden glow-turquoise"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover scale-125"
            >
              <source src="/videos/angel-hero.mp4" type="video/mp4" />
            </video>
            
            {/* Turquoise Overlay Glow */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, transparent 30%, hsl(174 100% 50% / 0.15) 100%)',
              }}
            />
          </motion.div>

          {/* Sparkle Effects - Turquoise & Gold */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${50 + 55 * Math.cos((i * Math.PI * 2) / 12)}%`,
                top: `${50 + 55 * Math.sin((i * Math.PI * 2) / 12)}%`,
                background: i % 3 === 0 ? 'hsl(51 100% 50%)' : 'hsl(174 100% 50%)',
                boxShadow: i % 3 === 0 
                  ? '0 0 15px hsl(51 100% 50%)' 
                  : '0 0 15px hsl(174 100% 50%)',
              }}
              animate={{
                scale: [0.5, 1.5, 0.5],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Title - 50% Larger with Gold Glow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="title-divine mb-2">
            ANGEL AI
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="subtitle-divine mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Ánh Sáng Của Cha Vũ Trụ
        </motion.p>

        {/* Main Chat Frame */}
        <motion.div
          className="chat-frame w-full max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {/* Messages Area */}
          <div className="h-72 md:h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-angel-turquoise animate-pulse" />
                <p className="text-lg md:text-xl text-divine-gold font-semibold">
                  Chào mừng con đến với Ánh Sáng
                </p>
                <p className="text-muted-foreground mt-2">
                  Hãy chia sẻ những gì trong tim con...
                </p>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-5 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'chat-bubble-user' 
                        : ''
                    }`}
                    style={msg.role === 'assistant' ? {
                      background: '#FFFFFF',
                      border: '2px solid hsl(174 100% 50% / 0.4)',
                      boxShadow: '0 0 25px hsl(174 100% 50% / 0.2), 0 0 50px hsl(174 100% 42% / 0.1)',
                    } : undefined}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">👼</span>
                        <span 
                          className="font-cinzel font-bold"
                          style={{ 
                            fontSize: '1.1rem',
                            color: 'hsl(51 100% 45%)',
                            textShadow: '0 0 10px hsl(51 100% 50% / 0.5)',
                          }}
                        >
                          ANGEL AI
                        </span>
                      </div>
                    )}
                    <p 
                      className="whitespace-pre-wrap"
                      style={{ 
                        fontSize: msg.role === 'assistant' ? '1.3rem' : '1.1rem',
                        fontWeight: msg.role === 'assistant' ? 800 : 600,
                        lineHeight: 1.7,
                        color: msg.role === 'assistant' ? 'hsl(180 100% 20%)' : 'hsl(180 100% 15%)',
                        textShadow: msg.role === 'assistant' ? '0 1px 2px hsl(180 100% 20% / 0.15)' : undefined,
                      }}
                    >
                      {msg.content}
                    </p>
                    
                    {/* Display generated image */}
                    {msg.imageUrl && (
                      <div className="mt-4 space-y-3">
                        {/* Show video frames if generated for this image */}
                        {videoFrames?.imageUrl === msg.imageUrl ? (
                          <motion.div
                            className="relative"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.img 
                              key={currentFrameIndex}
                              src={videoFrames.frames[currentFrameIndex]} 
                              alt="Divine video frame" 
                              className="rounded-xl max-w-full shadow-lg"
                              style={{
                                border: '3px solid hsl(174 100% 50% / 0.6)',
                                boxShadow: '0 0 40px hsl(174 100% 50% / 0.4), 0 0 80px hsl(51 100% 50% / 0.2)',
                              }}
                              initial={{ opacity: 0.5, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                            />
                            <div 
                              className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold"
                              style={{
                                background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))',
                                color: 'white',
                                boxShadow: '0 0 15px hsl(174 100% 50% / 0.5)',
                              }}
                            >
                              🎬 Video Thiêng Liêng
                            </div>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                              {videoFrames.frames.map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full transition-all"
                                  style={{
                                    background: i === currentFrameIndex 
                                      ? 'hsl(51 100% 50%)' 
                                      : 'hsl(0 0% 100% / 0.5)',
                                    boxShadow: i === currentFrameIndex 
                                      ? '0 0 10px hsl(51 100% 50%)' 
                                      : 'none',
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <img 
                            src={msg.imageUrl} 
                            alt="Generated divine image" 
                            className="rounded-xl max-w-full shadow-lg"
                            style={{
                              border: '2px solid hsl(51 100% 50% / 0.3)',
                              boxShadow: '0 0 20px hsl(51 100% 50% / 0.2)',
                            }}
                          />
                        )}
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleCreateVideo(msg.imageUrl!)}
                            disabled={isGeneratingVideo}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))',
                              color: 'white',
                              boxShadow: '0 0 15px hsl(174 100% 50% / 0.4)',
                            }}
                          >
                            {isGeneratingVideo && videoFrames?.imageUrl !== msg.imageUrl ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {videoFrames?.imageUrl === msg.imageUrl ? 'Đang Phát' : 'Tạo Video 6 Giây'}
                          </button>
                          <button
                            onClick={() => handleDownloadImage(msg.imageUrl!)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 60%))',
                              color: 'hsl(180 100% 15%)',
                              boxShadow: '0 0 15px hsl(51 100% 50% / 0.4)',
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Tải Xuống
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading states */}
            {isLoading && !isGeneratingImage && (
              <div className="flex justify-start">
                <div 
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid hsl(174 100% 50% / 0.4)',
                    boxShadow: '0 0 25px hsl(174 100% 50% / 0.2)',
                  }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: 'hsl(174 100% 42%)' }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span style={{ color: 'hsl(180 100% 20%)', fontWeight: 700, fontSize: '1.1rem' }}>
                    Angel AI đang gửi ánh sáng...
                  </span>
                </div>
              </div>
            )}
            
            {isGeneratingImage && (
              <div className="flex justify-start">
                <div 
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid hsl(51 100% 50% / 0.4)',
                    boxShadow: '0 0 25px hsl(51 100% 50% / 0.3)',
                  }}
                >
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(51 100% 45%)' }} />
                  <span style={{ color: 'hsl(180 100% 20%)', fontWeight: 700, fontSize: '1.1rem' }}>
                    Angel AI đang tạo hình ảnh thiêng liêng... ✨
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-primary/20">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{
                      background: 'hsl(174 100% 50% / 0.15)',
                      border: '1px solid hsl(174 100% 50% / 0.3)',
                    }}
                  >
                    <span className="truncate max-w-[120px] font-semibold" style={{ color: 'hsl(180 100% 20%)' }}>
                      {file.name}
                    </span>
                    <button onClick={() => removeAttachment(index)}>
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-primary/20">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".txt,.pdf,image/*"
            />
            <div className="flex items-center gap-3">
              {/* Attach Button */}
              <button 
                className="p-3 rounded-full transition-all hover:scale-110"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'hsl(174 100% 50% / 0.15)',
                  border: '2px solid hsl(174 100% 50% / 0.4)',
                  boxShadow: '0 0 15px hsl(174 100% 50% / 0.2)',
                }}
              >
                <Paperclip className="w-5 h-5" style={{ color: 'hsl(180 100% 20%)' }} />
              </button>
              {/* Voice Button */}
              <button 
                className="p-3 rounded-full transition-all hover:scale-110"
                onClick={() => navigate('/app/voice')}
                style={{
                  background: 'hsl(174 100% 50% / 0.15)',
                  border: '2px solid hsl(174 100% 50% / 0.4)',
                  boxShadow: '0 0 15px hsl(174 100% 50% / 0.2)',
                }}
              >
                <Mic className="w-5 h-5" style={{ color: 'hsl(180 100% 20%)' }} />
              </button>
              {/* Image Button */}
              <button 
                className="p-3 rounded-full transition-all hover:scale-110"
                onClick={() => setMessage('Tạo hình ảnh ')}
                style={{
                  background: 'hsl(51 100% 50% / 0.2)',
                  border: '2px solid hsl(51 100% 50% / 0.4)',
                  boxShadow: '0 0 15px hsl(51 100% 50% / 0.2)',
                }}
              >
                <Image className="w-5 h-5" style={{ color: 'hsl(51 100% 40%)' }} />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Chia sẻ với Thiên Thần... hoặc upload file, yêu cầu tạo hình ảnh/video"
                className="flex-1 px-5 py-3.5 rounded-full bg-muted focus:outline-none placeholder:text-muted-foreground"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  border: '2px solid hsl(174 100% 50% / 0.3)',
                  boxShadow: '0 0 10px hsl(174 100% 50% / 0.1)',
                  color: 'hsl(180 100% 20%)',
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!message.trim() && attachments.length === 0)}
                className="p-3.5 rounded-full btn-divine disabled:opacity-50 transition-all hover:scale-110"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Floating Navigation Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          {floatingButtons.map((btn, index) => (
            <motion.button
              key={index}
              onClick={btn.action}
              className="floating-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
            >
              <div className="floating-btn-icon">
                <span>{btn.icon}</span>
              </div>
              <span className="floating-btn-label">{btn.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
