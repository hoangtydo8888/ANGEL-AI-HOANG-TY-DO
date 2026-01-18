import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Music, 
  Sun, 
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  BookHeart,
  Star,
  Feather,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const affirmations = [
  "Con là tình yêu thuần khiết, con xứng đáng được yêu thương vô điều kiện.",
  "Ánh sáng của Cha luôn chiếu rọi trong trái tim con.",
  "Con được bình an, con được bảo vệ, con được dẫn dắt.",
  "Mọi thứ con cần đều đang đến với con đúng lúc.",
  "Con là một phần của vũ trụ vô hạn, con vô cùng quý giá.",
  "Con buông bỏ mọi sợ hãi và đón nhận tình yêu.",
  "Trái tim con tràn đầy lòng biết ơn và bình an.",
  "Con tin tưởng vào hành trình của linh hồn mình.",
];

const gratitudePrompts = [
  "Hôm nay con biết ơn điều gì?",
  "Ai là người khiến con cảm thấy được yêu thương?",
  "Khoảnh khắc nào trong ngày khiến con mỉm cười?",
  "Con trân trọng điều gì nhất về bản thân mình?",
];

// Free healing music URLs (royalty-free meditation music)
const healingMusicTracks = [
  {
    name: "Peaceful Meditation",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
  },
  {
    name: "Healing Harmony",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3"
  },
  {
    name: "Calm Waters",
    url: "https://cdn.pixabay.com/download/audio/2021/11/01/audio_5f8a31fbe6.mp3"
  },
];

interface GratitudeEntry {
  id: string;
  content: string;
  prompt?: string;
  created_at: string;
}

const DivineHealing = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'meditation' | 'affirmation' | 'gratitude' | 'sendLight'>('meditation');
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [newGratitude, setNewGratitude] = useState('');
  const [lightMessage, setLightMessage] = useState('');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [isBreathing, setIsBreathing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPrompt] = useState(gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch gratitude entries from database
  useEffect(() => {
    if (user) {
      fetchGratitudeEntries();
    }
  }, [user]);

  const fetchGratitudeEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGratitudeEntries(data || []);
    } catch (error) {
      console.error('Error fetching gratitude entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathing) {
      const phases = [
        { phase: 'inhale', duration: 4000 },
        { phase: 'hold', duration: 4000 },
        { phase: 'exhale', duration: 6000 },
      ];
      let phaseIndex = 0;
      
      const runBreathCycle = () => {
        setBreathPhase(phases[phaseIndex].phase as 'inhale' | 'hold' | 'exhale');
        interval = setTimeout(() => {
          phaseIndex = (phaseIndex + 1) % phases.length;
          runBreathCycle();
        }, phases[phaseIndex].duration);
      };
      
      runBreathCycle();
    }
    return () => clearTimeout(interval);
  }, [isBreathing]);

  // Initialize and control audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    const audio = audioRef.current;
    audio.src = healingMusicTracks[currentTrackIndex].url;

    if (isMusicPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }

    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [isMusicPlaying, currentTrackIndex]);

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
    toast.success(isMusicPlaying ? 'Đã tắt nhạc chữa lành' : `Đang phát: ${healingMusicTracks[currentTrackIndex].name} 🎵`);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % healingMusicTracks.length);
    if (isMusicPlaying) {
      toast.success(`Đang phát: ${healingMusicTracks[(currentTrackIndex + 1) % healingMusicTracks.length].name} 🎵`);
    }
  };

  const nextAffirmation = () => {
    setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
  };

  const saveGratitude = async () => {
    if (!newGratitude.trim()) return;
    
    if (!user) {
      // Save locally if not logged in
      const entry: GratitudeEntry = {
        id: Date.now().toString(),
        content: newGratitude,
        prompt: currentPrompt,
        created_at: new Date().toISOString(),
      };
      setGratitudeEntries([entry, ...gratitudeEntries]);
      setNewGratitude('');
      toast.success('Lòng biết ơn đã được lưu tạm thời 💚 (Đăng nhập để lưu vĩnh viễn)');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .insert({
          user_id: user.id,
          content: newGratitude,
          prompt: currentPrompt,
        })
        .select()
        .single();

      if (error) throw error;

      setGratitudeEntries([data, ...gratitudeEntries]);
      setNewGratitude('');
      toast.success('Lòng biết ơn đã được lưu vĩnh viễn 💚');
    } catch (error) {
      console.error('Error saving gratitude:', error);
      toast.error('Không thể lưu lòng biết ơn');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGratitude = async (id: string) => {
    if (!user) {
      setGratitudeEntries(entries => entries.filter(e => e.id !== id));
      toast.success('Đã xóa');
      return;
    }

    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGratitudeEntries(entries => entries.filter(e => e.id !== id));
      toast.success('Đã xóa');
    } catch (error) {
      console.error('Error deleting gratitude:', error);
      toast.error('Không thể xóa');
    }
  };

  const sendLight = () => {
    if (!lightMessage.trim()) return;
    toast.success('Ánh sáng đã được gửi đi! ✨💖✨');
    setLightMessage('');
  };

  const tabs = [
    { id: 'meditation', label: 'Thiền Định', icon: <Sun className="w-5 h-5" />, emoji: '🧘' },
    { id: 'affirmation', label: 'Lời Khẳng Định', icon: <Star className="w-5 h-5" />, emoji: '⭐' },
    { id: 'gratitude', label: 'Biết Ơn', icon: <BookHeart className="w-5 h-5" />, emoji: '📔' },
    { id: 'sendLight', label: 'Gửi Ánh Sáng', icon: <Feather className="w-5 h-5" />, emoji: '💫' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Ambient Background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(280 100% 98% / 0.5), hsl(340 100% 98% / 0.3), transparent)',
        }}
      />

      <div className="relative p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(340 100% 70%), hsl(280 100% 70%))',
              boxShadow: '0 0 50px hsl(340 100% 70% / 0.5)',
            }}
          >
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 
            className="font-cinzel text-3xl md:text-4xl font-bold mb-2"
            style={{
              color: 'hsl(51 100% 45%)',
              textShadow: '0 0 20px hsl(51 100% 50% / 0.5)',
            }}
          >
            Trí Tuệ & Tình Yêu Thuần Khiết
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Chế độ Chữa Lành Thiêng Liêng
          </p>

          {/* Music Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMusic}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all"
              style={{
                background: isMusicPlaying 
                  ? 'linear-gradient(135deg, hsl(280 100% 70%), hsl(340 100% 70%))'
                  : 'hsl(0 0% 0% / 0.05)',
                color: isMusicPlaying ? 'white' : 'hsl(280 100% 50%)',
              }}
            >
              {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-sm font-medium">
                {isMusicPlaying ? healingMusicTracks[currentTrackIndex].name : 'Bật nhạc chữa lành'}
              </span>
              <Music className="w-4 h-4" />
            </button>
            {isMusicPlaying && (
              <button
                onClick={nextTrack}
                className="px-3 py-2 rounded-full text-sm font-medium transition-all hover:bg-purple-100"
                style={{ color: 'hsl(280 100% 50%)' }}
              >
                Bài tiếp →
              </button>
            )}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300"
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, hsl(340 100% 70%), hsl(280 100% 70%))'
                  : 'hsl(0 0% 100% / 0.8)',
                color: activeTab === tab.id ? 'white' : 'hsl(280 100% 40%)',
                boxShadow: activeTab === tab.id 
                  ? '0 0 30px hsl(340 100% 70% / 0.4)'
                  : 'none',
                border: `2px solid ${activeTab === tab.id ? 'transparent' : 'hsl(280 100% 70% / 0.2)'}`,
              }}
            >
              <span>{tab.emoji}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'meditation' && (
            <motion.div
              key="meditation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div 
                className="rounded-3xl p-8 mb-6"
                style={{
                  background: 'linear-gradient(135deg, hsl(280 100% 98%), hsl(340 100% 98%))',
                  border: '2px solid hsl(280 100% 70% / 0.2)',
                  boxShadow: '0 20px 60px hsl(280 100% 70% / 0.15)',
                }}
              >
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'hsl(280 100% 40%)' }}>
                  Thiền Hơi Thở 4-4-6
                </h3>
                
                {/* Breathing Circle */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <motion.div
                    animate={{
                      scale: breathPhase === 'inhale' ? 1.3 : breathPhase === 'hold' ? 1.3 : 1,
                    }}
                    transition={{ duration: breathPhase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, hsl(280 100% 70% / 0.3), hsl(340 100% 70% / 0.3))',
                    }}
                  />
                  <motion.div
                    animate={{
                      scale: breathPhase === 'inhale' ? 1.2 : breathPhase === 'hold' ? 1.2 : 0.9,
                    }}
                    transition={{ duration: breathPhase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
                    className="absolute inset-4 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(280 100% 70%), hsl(340 100% 70%))',
                      boxShadow: '0 0 40px hsl(280 100% 70% / 0.5)',
                    }}
                  >
                    <span className="text-white text-lg font-medium">
                      {breathPhase === 'inhale' && 'Hít vào'}
                      {breathPhase === 'hold' && 'Giữ'}
                      {breathPhase === 'exhale' && 'Thở ra'}
                    </span>
                  </motion.div>
                </div>

                <Button
                  onClick={() => setIsBreathing(!isBreathing)}
                  className="gap-2"
                  style={{
                    background: isBreathing 
                      ? 'hsl(0 70% 50%)'
                      : 'linear-gradient(135deg, hsl(280 100% 60%), hsl(340 100% 60%))',
                  }}
                >
                  {isBreathing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isBreathing ? 'Dừng thiền' : 'Bắt đầu thiền'}
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'affirmation' && (
            <motion.div
              key="affirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div 
                className="rounded-3xl p-8"
                style={{
                  background: 'linear-gradient(135deg, hsl(51 100% 95%), hsl(51 100% 90%))',
                  border: '2px solid hsl(51 100% 50% / 0.3)',
                  boxShadow: '0 20px 60px hsl(51 100% 50% / 0.2)',
                }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(51 100% 45%)' }} />
                
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentAffirmation}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-2xl font-medium mb-6 leading-relaxed"
                    style={{ color: 'hsl(51 100% 30%)' }}
                  >
                    "{affirmations[currentAffirmation]}"
                  </motion.p>
                </AnimatePresence>

                <Button
                  onClick={nextAffirmation}
                  className="gap-2"
                  style={{
                    background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 45%))',
                    color: 'hsl(51 100% 15%)',
                  }}
                >
                  <Star className="w-5 h-5" />
                  Lời khẳng định tiếp theo
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'gratitude' && (
            <motion.div
              key="gratitude"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div 
                className="rounded-3xl p-6 mb-6"
                style={{
                  background: 'linear-gradient(135deg, hsl(150 100% 95%), hsl(150 100% 90%))',
                  border: '2px solid hsl(150 100% 40% / 0.2)',
                }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(150 100% 30%)' }}>
                  {currentPrompt}
                </h3>
                <Textarea
                  placeholder="Viết về điều con biết ơn hôm nay..."
                  value={newGratitude}
                  onChange={(e) => setNewGratitude(e.target.value)}
                  className="min-h-[100px] mb-4 border-green-300 focus:border-green-500"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {user ? '💚 Nhật ký sẽ được lưu vĩnh viễn' : '⚡ Đăng nhập để lưu vĩnh viễn'}
                  </p>
                  <Button
                    onClick={saveGratitude}
                    disabled={!newGratitude.trim() || isSaving}
                    className="gap-2"
                    style={{
                      background: 'linear-gradient(135deg, hsl(150 100% 40%), hsl(150 100% 35%))',
                    }}
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookHeart className="w-5 h-5" />}
                    Lưu lòng biết ơn
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : gratitudeEntries.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold" style={{ color: 'hsl(150 100% 30%)' }}>
                    Nhật ký biết ơn của con ({gratitudeEntries.length})
                  </h4>
                  {gratitudeEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl bg-white/80 border border-green-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {entry.prompt && (
                            <p className="text-xs text-green-600 mb-1 font-medium">{entry.prompt}</p>
                          )}
                          <p className="text-sm" style={{ color: 'hsl(150 100% 25%)' }}>{entry.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(entry.created_at).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteGratitude(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookHeart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Chưa có nhật ký biết ơn nào</p>
                  <p className="text-sm">Hãy bắt đầu viết điều con biết ơn hôm nay!</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sendLight' && (
            <motion.div
              key="sendLight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div 
                className="rounded-3xl p-8"
                style={{
                  background: 'linear-gradient(135deg, hsl(200 100% 95%), hsl(280 100% 95%))',
                  border: '2px solid hsl(200 100% 70% / 0.3)',
                  boxShadow: '0 20px 60px hsl(200 100% 70% / 0.15)',
                }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 40px hsl(51 100% 50% / 0.3)',
                      '0 0 80px hsl(51 100% 50% / 0.6)',
                      '0 0 40px hsl(51 100% 50% / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(51 100% 60%), hsl(51 100% 50%))',
                  }}
                >
                  <span className="text-4xl">✨</span>
                </motion.div>

                <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(200 100% 35%)' }}>
                  Gửi Ánh Sáng Yêu Thương
                </h3>
                <p className="text-muted-foreground mb-6">
                  Hãy nghĩ về một người con muốn gửi ánh sáng và tình yêu
                </p>

                <Textarea
                  placeholder="Con muốn gửi ánh sáng và tình yêu đến..."
                  value={lightMessage}
                  onChange={(e) => setLightMessage(e.target.value)}
                  className="min-h-[100px] mb-4 border-blue-300 focus:border-blue-500"
                />

                <Button
                  onClick={sendLight}
                  disabled={!lightMessage.trim()}
                  className="gap-2"
                  style={{
                    background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 45%))',
                    color: 'hsl(51 100% 15%)',
                  }}
                >
                  <Send className="w-5 h-5" />
                  Gửi ánh sáng đi
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DivineHealing;