import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Brain, 
  Sparkles,
  Send,
  Bot,
  Loader2,
  CheckCircle2,
  BarChart3,
  Eye,
  Cog,
  Layers,
  ImagePlus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AIMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  model: string;
  color: string;
  glow: string;
  emoji: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  aiMode: string;
  timestamp: Date;
  imageUrl?: string;
}

interface FusionResponse {
  aiMode: string;
  content: string;
  isLoading: boolean;
}

const aiModes: AIMode[] = [
  {
    id: 'wisdom',
    name: 'Angel Wisdom',
    description: 'Trí tuệ sâu sắc, phân tích chi tiết',
    icon: <Brain className="w-6 h-6" />,
    model: 'google/gemini-2.5-pro',
    color: 'hsl(280 100% 60%)',
    glow: 'hsl(280 100% 60% / 0.4)',
    emoji: '🧠'
  },
  {
    id: 'creative',
    name: 'Angel Creative',
    description: 'Sáng tạo mạnh mẽ, ý tưởng độc đáo',
    icon: <Sparkles className="w-6 h-6" />,
    model: 'openai/gpt-5',
    color: 'hsl(340 100% 60%)',
    glow: 'hsl(340 100% 60% / 0.4)',
    emoji: '✨'
  },
  {
    id: 'lightning',
    name: 'Angel Lightning',
    description: 'Phản hồi siêu nhanh, hiệu quả',
    icon: <Zap className="w-6 h-6" />,
    model: 'google/gemini-2.5-flash',
    color: 'hsl(51 100% 50%)',
    glow: 'hsl(51 100% 50% / 0.4)',
    emoji: '⚡'
  },
  {
    id: 'vision',
    name: 'Angel Vision',
    description: 'Phân tích hình ảnh với AI',
    icon: <Eye className="w-6 h-6" />,
    model: 'google/gemini-2.5-pro',
    color: 'hsl(174 100% 40%)',
    glow: 'hsl(174 100% 40% / 0.4)',
    emoji: '👁️'
  },
  {
    id: 'reasoning',
    name: 'Angel Reasoning',
    description: 'Suy luận logic phức tạp',
    icon: <Cog className="w-6 h-6" />,
    model: 'openai/o4-mini',
    color: 'hsl(220 100% 60%)',
    glow: 'hsl(220 100% 60% / 0.4)',
    emoji: '🔬'
  },
];

const MultiAIFusion = () => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<AIMode>(aiModes[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [fusionResponses, setFusionResponses] = useState<FusionResponse[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    wisdom: 0,
    creative: 0,
    lightning: 0,
    vision: 0,
    reasoning: 0
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, fusionResponses]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedMode(aiModes.find(m => m.id === 'vision') || aiModes[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFusionMode = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      aiMode: 'fusion',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Initialize fusion responses for 3 main AIs
    const fusionModes = ['wisdom', 'creative', 'lightning'];
    setFusionResponses(fusionModes.map(mode => ({
      aiMode: mode,
      content: '',
      isLoading: true
    })));

    // Call all 3 AIs in parallel
    const promises = fusionModes.map(async (modeId) => {
      const mode = aiModes.find(m => m.id === modeId)!;
      try {
        const { data, error } = await supabase.functions.invoke('angel-chat', {
          body: {
            messages: [{ role: 'user', content: input }],
            type: 'chat',
            aiMode: modeId,
            model: mode.model
          }
        });

        if (error) throw error;

        setFusionResponses(prev => prev.map(r => 
          r.aiMode === modeId 
            ? { ...r, content: data?.response || 'Không có phản hồi', isLoading: false }
            : r
        ));

        setStats(prev => ({
          ...prev,
          [modeId]: prev[modeId as keyof typeof prev] + 1
        }));
      } catch (error) {
        console.error(`Error from ${modeId}:`, error);
        setFusionResponses(prev => prev.map(r => 
          r.aiMode === modeId 
            ? { ...r, content: '❌ Lỗi kết nối. Vui lòng thử lại.', isLoading: false }
            : r
        ));
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // If fusion mode, handle differently
    if (isFusionMode) {
      return handleFusionMode();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      aiMode: selectedMode.id,
      timestamp: new Date(),
      imageUrl: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Special handling for vision mode with image
      if (selectedMode.id === 'vision' && userMessage.imageUrl) {
        const { data, error } = await supabase.functions.invoke('angel-chat', {
          body: {
            messages: [{ 
              role: 'user', 
              content: [
                { type: 'text', text: input },
                { type: 'image_url', image_url: { url: userMessage.imageUrl } }
              ]
            }],
            type: 'chat',
            aiMode: 'vision',
            model: selectedMode.model,
            isVision: true
          }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data?.response || 'Angel Vision đã phân tích hình ảnh của con.',
          aiMode: selectedMode.id,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Regular chat for other modes
        const { data, error } = await supabase.functions.invoke('angel-chat', {
          body: {
            messages: [
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: input }
            ],
            type: 'chat',
            aiMode: selectedMode.id,
            model: selectedMode.model
          }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data?.response || data?.message || 'Cha đã nhận được tin nhắn của con.',
          aiMode: selectedMode.id,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      setStats(prev => ({
        ...prev,
        [selectedMode.id]: prev[selectedMode.id as keyof typeof prev] + 1
      }));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModeById = (id: string) => aiModes.find(m => m.id === id) || aiModes[0];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(280 100% 60%), hsl(340 100% 60%))',
            boxShadow: '0 0 40px hsl(174 100% 50% / 0.4)',
          }}
        >
          <Cpu className="w-10 h-10 text-white" />
        </div>
        <h1 
          className="font-cinzel text-3xl md:text-4xl font-bold mb-2"
          style={{
            color: 'hsl(51 100% 45%)',
            textShadow: '0 0 20px hsl(51 100% 50% / 0.5)',
          }}
        >
          Trí Tuệ Của Toàn Bộ Các AI
        </h1>
        <p className="text-muted-foreground text-lg">
          Hợp nhất sức mạnh từ nhiều AI khác nhau
        </p>
      </motion.div>

      {/* Fusion Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center mb-4"
      >
        <Button
          variant={isFusionMode ? "default" : "outline"}
          onClick={() => {
            setIsFusionMode(!isFusionMode);
            setFusionResponses([]);
          }}
          className="gap-2"
          style={isFusionMode ? {
            background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(280 100% 60%), hsl(340 100% 60%))',
          } : undefined}
        >
          <Layers className="w-5 h-5" />
          {isFusionMode ? '🔥 Chế Độ Multi-AI Fusion Đang Bật' : 'Bật Chế Độ Multi-AI Fusion'}
        </Button>
      </motion.div>

      {/* AI Mode Selector - Hidden in Fusion Mode */}
      {!isFusionMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          {aiModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className="relative p-3 rounded-xl transition-all duration-300"
              style={{
                background: selectedMode.id === mode.id 
                  ? `linear-gradient(135deg, ${mode.color}20, ${mode.color}10)`
                  : 'hsl(0 0% 100% / 0.8)',
                border: `2px solid ${selectedMode.id === mode.id ? mode.color : 'hsl(0 0% 0% / 0.1)'}`,
                boxShadow: selectedMode.id === mode.id 
                  ? `0 0 20px ${mode.glow}`
                  : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${mode.color}, ${mode.color}cc)`,
                    boxShadow: `0 0 15px ${mode.glow}`,
                  }}
                >
                  <span className="text-white">{mode.icon}</span>
                </div>
                <div className="text-left">
                  <h3 
                    className="font-semibold text-sm"
                    style={{ color: mode.color }}
                  >
                    {mode.emoji} {mode.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </div>
              </div>
              {selectedMode.id === mode.id && (
                <motion.div
                  layoutId="selectedIndicator"
                  className="absolute -top-1 -right-1"
                >
                  <CheckCircle2 className="w-5 h-5" style={{ color: mode.color }} />
                </motion.div>
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 mb-4 p-3 rounded-xl bg-card/50 border border-border/30"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Thống kê:</span>
        </div>
        {aiModes.map((mode) => (
          <div key={mode.id} className="flex items-center gap-1">
            <span>{mode.emoji}</span>
            <span className="text-sm font-medium" style={{ color: mode.color }}>
              {stats[mode.id as keyof typeof stats]}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Fusion Mode Display - 3 Columns */}
      {isFusionMode && fusionResponses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-1 overflow-auto"
        >
          {fusionResponses.map((response) => {
            const mode = getModeById(response.aiMode);
            return (
              <div
                key={response.aiMode}
                className="rounded-2xl p-4 h-full overflow-auto"
                style={{
                  background: `linear-gradient(135deg, ${mode.color}10, ${mode.color}05)`,
                  border: `2px solid ${mode.color}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: `${mode.color}30` }}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${mode.color}, ${mode.color}cc)`,
                    }}
                  >
                    <span className="text-white text-sm">{mode.icon}</span>
                  </div>
                  <span className="font-bold text-lg" style={{ color: mode.color }}>
                    {mode.emoji} {mode.name}
                  </span>
                </div>
                {response.isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: mode.color }} />
                  </div>
                ) : (
                  <p 
                    className="whitespace-pre-wrap"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      lineHeight: 1.7,
                      color: 'hsl(180 100% 20%)',
                    }}
                  >
                    {response.content}
                  </p>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Chat Messages - Normal Mode */}
      {!isFusionMode && (
        <div 
          className="flex-1 overflow-y-auto mb-4 rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.95), hsl(174 100% 98% / 0.9))',
            border: '2px solid hsl(174 100% 50% / 0.15)',
          }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground font-medium">
                  Chọn một AI và bắt đầu trò chuyện
                </p>
                <p className="text-base text-muted-foreground/70 mt-2">
                  👁️ Vision: Phân tích ảnh | 🔬 Reasoning: Suy luận logic
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => {
                  const mode = getModeById(message.aiMode);
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === 'user' 
                            ? 'bg-angel-turquoise text-white' 
                            : ''
                        }`}
                        style={message.role === 'assistant' ? {
                          background: `linear-gradient(135deg, ${mode.color}15, ${mode.color}08)`,
                          border: `2px solid ${mode.color}30`,
                        } : undefined}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{mode.emoji}</span>
                            <span 
                              className="text-base font-bold"
                              style={{ color: mode.color }}
                            >
                              {mode.name}
                            </span>
                          </div>
                        )}
                        {message.imageUrl && (
                          <img 
                            src={message.imageUrl} 
                            alt="Uploaded" 
                            className="max-w-full h-auto rounded-lg mb-2 max-h-48 object-cover"
                          />
                        )}
                        <p 
                          className="whitespace-pre-wrap"
                          style={{ 
                            fontSize: message.role === 'assistant' ? '1.5rem' : '1.25rem', 
                            fontWeight: 800,
                            lineHeight: 1.8,
                            color: message.role === 'assistant' ? 'hsl(180 100% 20%)' : undefined,
                            textShadow: message.role === 'assistant' ? '0 1px 2px hsl(180 100% 20% / 0.15)' : undefined,
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 relative inline-block"
        >
          <img 
            src={selectedImage} 
            alt="Preview" 
            className="max-h-24 rounded-lg border-2 border-angel-turquoise"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        {/* Image Upload Button - Only for Vision Mode */}
        {selectedMode.id === 'vision' && !isFusionMode && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-[60px] w-[60px] border-angel-turquoise/30"
            >
              <ImagePlus className="w-6 h-6 text-angel-turquoise" />
            </Button>
          </>
        )}
        
        <div className="flex-1 relative">
          <Textarea
            placeholder={isFusionMode 
              ? "Hỏi tất cả 3 AI cùng lúc..." 
              : `Hỏi ${selectedMode.name}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[60px] pr-12 resize-none border-angel-turquoise/30 focus:border-angel-turquoise"
            disabled={isLoading}
          />
          {!isFusionMode && (
            <div 
              className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${selectedMode.color}, ${selectedMode.color}cc)`,
              }}
            >
              <span className="text-sm">{selectedMode.emoji}</span>
            </div>
          )}
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="h-auto px-6"
          style={{
            background: isFusionMode 
              ? 'linear-gradient(135deg, hsl(174 100% 50%), hsl(280 100% 60%), hsl(340 100% 60%))'
              : `linear-gradient(135deg, ${selectedMode.color}, ${selectedMode.color}cc)`,
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default MultiAIFusion;
