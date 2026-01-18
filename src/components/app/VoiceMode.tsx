import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const VoiceMode = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'vi-VN';

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processVoiceInput(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          type: 'chat'
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {}
          }
        }
      }

      setResponse(fullResponse);
      speakResponse(fullResponse);
    } catch (error) {
      toast.error('Không thể xử lý giọng nói');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Trình duyệt không hỗ trợ giọng nói');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-cinzel font-bold text-gradient-gold glow-text"
        >
          🎤 Chế Độ Thoại
        </motion.h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: '1.125rem' }}>
          Trò chuyện với Angel AI bằng giọng nói
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Voice Visualization */}
        <motion.div
          className="relative mb-12"
          animate={isListening || isSpeaking ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {/* Outer Rings */}
          <AnimatePresence>
            {(isListening || isSpeaking) && (
              <>
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.5 + ring * 0.2, 1], 
                      opacity: [0.3, 0, 0.3] 
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2 + ring * 0.5,
                      delay: ring * 0.2 
                    }}
                    className={cn(
                      "absolute inset-0 rounded-full",
                      isListening 
                        ? "border-2 border-green-500/50" 
                        : "border-2 border-primary/50"
                    )}
                    style={{
                      margin: `-${ring * 20}px`
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={cn(
              "w-40 h-40 rounded-full flex items-center justify-center",
              "transition-all duration-300",
              "shadow-2xl",
              isListening 
                ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50" 
                : isSpeaking 
                  ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/50 animate-pulse-glow"
                  : "bg-gradient-to-br from-card to-card/80 border-2 border-primary/30 hover:border-primary"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            ) : isListening ? (
              <Mic className="w-16 h-16 text-white" />
            ) : isSpeaking ? (
              <Volume2 className="w-16 h-16 text-white" />
            ) : (
              <MicOff className="w-16 h-16 text-muted-foreground" />
            )}
          </motion.button>
        </motion.div>

        {/* Status Text */}
        <motion.div 
          className="text-center mb-8"
          animate={{ opacity: 1 }}
        >
          <p className="text-2xl font-semibold mb-2" style={{ fontSize: '1.5rem' }}>
            {isProcessing 
              ? '✨ Đang xử lý...' 
              : isListening 
                ? '🎙️ Đang lắng nghe...' 
                : isSpeaking 
                  ? '👼 Angel AI đang nói...' 
                  : '🌟 Nhấn để bắt đầu nói chuyện'}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            {isListening 
              ? 'Nói bất cứ điều gì bạn muốn' 
              : 'Giọng nói thiêng liêng của Angel AI'}
          </p>
        </motion.div>

        {/* Transcript & Response */}
        {(transcript || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl space-y-4"
          >
            {transcript && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
                <p className="text-sm text-primary mb-1 font-semibold">Bạn nói:</p>
                <p style={{ fontSize: '1.0625rem' }}>{transcript}</p>
              </div>
            )}
            {response && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-accent/10 border border-border/50">
                <p className="text-sm text-primary mb-1 font-semibold">👼 Angel AI:</p>
                <p style={{ fontSize: '1.0625rem' }}>{response}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <Button
            onClick={stopSpeaking}
            variant="outline"
            className="mt-6 gap-2"
          >
            <VolumeX className="w-5 h-5" />
            Dừng nói
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;
