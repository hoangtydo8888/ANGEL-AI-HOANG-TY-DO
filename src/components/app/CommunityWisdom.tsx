import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Heart, 
  Award, 
  TrendingUp,
  Send,
  Sparkles,
  BookOpen,
  Star,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WisdomPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  created_at: string;
  author_name?: string;
}

const categories = [
  { id: 'all', label: 'Tất cả', icon: '🌈' },
  { id: 'spiritual', label: 'Tâm Linh', icon: '✨' },
  { id: 'meditation', label: 'Thiền Định', icon: '🧘' },
  { id: 'love', label: 'Tình Yêu', icon: '💖' },
  { id: 'healing', label: 'Chữa Lành', icon: '💚' },
  { id: 'gratitude', label: 'Biết Ơn', icon: '🙏' },
];

const categoryEmojiMap: Record<string, string> = {
  spiritual: '✨',
  meditation: '🧘',
  love: '💖',
  healing: '💚',
  gratitude: '🙏',
  general: '🌟',
};

const CommunityWisdom = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newWisdom, setNewWisdom] = useState('');
  const [newCategory, setNewCategory] = useState('spiritual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wisdomPosts, setWisdomPosts] = useState<WisdomPost[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ members: 0, posts: 0, interactions: 0, likes: 0 });

  // Fetch posts from database
  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWisdomPosts(data || []);
      
      // Calculate stats
      const totalLikes = (data || []).reduce((sum, post) => sum + (post.likes_count || 0), 0);
      setStats({
        members: Math.floor(Math.random() * 1000) + 2000, // Placeholder
        posts: (data || []).length,
        interactions: totalLikes * 3,
        likes: totalLikes,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserLikes(new Set((data || []).map(like => like.post_id)));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleSubmitWisdom = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chia sẻ tri thức');
      return;
    }
    if (!newWisdom.trim()) {
      toast.error('Hãy viết điều gì đó để chia sẻ');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title: newWisdom.slice(0, 100),
          content: newWisdom,
          category: newCategory,
        })
        .select()
        .single();

      if (error) throw error;

      setWisdomPosts([data, ...wisdomPosts]);
      setNewWisdom('');
      toast.success('Tri thức đã được chia sẻ! 🎉');
    } catch (error) {
      console.error('Error submitting wisdom:', error);
      toast.error('Không thể chia sẻ tri thức');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    const hasLiked = userLikes.has(postId);

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        // Update likes count
        await supabase
          .from('community_posts')
          .update({ likes_count: wisdomPosts.find(p => p.id === postId)!.likes_count - 1 })
          .eq('id', postId);

        setUserLikes(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });

        setWisdomPosts(posts =>
          posts.map(post =>
            post.id === postId ? { ...post, likes_count: post.likes_count - 1 } : post
          )
        );
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ user_id: user.id, post_id: postId });

        // Update likes count
        await supabase
          .from('community_posts')
          .update({ likes_count: wisdomPosts.find(p => p.id === postId)!.likes_count + 1 })
          .eq('id', postId);

        setUserLikes(prev => new Set([...prev, postId]));

        setWisdomPosts(posts =>
          posts.map(post =>
            post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post
          )
        );

        toast.success('Bạn đã gửi tình yêu! 💖');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWisdomPosts(posts => posts.filter(p => p.id !== postId));
      toast.success('Đã xóa bài viết');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Không thể xóa bài viết');
    }
  };

  const filteredPosts = selectedCategory === 'all' 
    ? wisdomPosts 
    : wisdomPosts.filter(post => post.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))',
            boxShadow: '0 0 40px hsl(174 100% 50% / 0.4)',
          }}
        >
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 
          className="font-cinzel text-3xl md:text-4xl font-bold mb-2"
          style={{
            color: 'hsl(51 100% 45%)',
            textShadow: '0 0 20px hsl(51 100% 50% / 0.5)',
          }}
        >
          Trí Tuệ Của Toàn Nhân Loại
        </h1>
        <p className="text-muted-foreground text-lg">
          Chia sẻ ánh sáng tri thức của bạn với cộng đồng
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Share Wisdom Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.95), hsl(174 100% 98% / 0.9))',
              border: '2px solid hsl(174 100% 50% / 0.2)',
              boxShadow: '0 10px 40px hsl(174 100% 50% / 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6" style={{ color: 'hsl(51 100% 45%)' }} />
              <h3 
                className="font-semibold text-lg"
                style={{ color: 'hsl(180 100% 20%)' }}
              >
                Chia sẻ tri thức của bạn
              </h3>
            </div>
            <Textarea
              placeholder="Viết điều gì đó ý nghĩa để truyền cảm hứng cho mọi người..."
              value={newWisdom}
              onChange={(e) => setNewWisdom(e.target.value)}
              className="min-h-[100px] mb-4 border-angel-turquoise/30 focus:border-angel-turquoise"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.slice(1).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNewCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    newCategory === cat.id
                      ? 'bg-angel-turquoise text-white'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {user ? '💎 Chia sẻ tri thức với cộng đồng' : '⚡ Đăng nhập để chia sẻ'}
              </p>
              <Button
                onClick={handleSubmitWisdom}
                disabled={isSubmitting || !newWisdom.trim() || !user}
                className="gap-2"
                style={{
                  background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))',
                }}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? 'Đang gửi...' : 'Chia sẻ'}
              </Button>
            </div>
          </motion.div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-angel-turquoise text-white shadow-lg'
                    : 'bg-card hover:bg-muted/50 border border-border/50'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Wisdom Posts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-angel-turquoise" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Chưa có bài viết nào</p>
              <p className="text-sm">Hãy là người đầu tiên chia sẻ tri thức!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl p-5 group"
                    style={{
                      background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.98), hsl(174 100% 98% / 0.95))',
                      border: '2px solid hsl(174 100% 50% / 0.15)',
                      boxShadow: '0 4px 20px hsl(174 100% 50% / 0.08)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, hsl(51 100% 50% / 0.2), hsl(51 100% 60% / 0.1))',
                          border: '2px solid hsl(51 100% 50% / 0.3)',
                        }}
                      >
                        {categoryEmojiMap[post.category] || '🌟'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 
                              className="font-semibold"
                              style={{ color: 'hsl(180 100% 20%)' }}
                            >
                              Linh Hồn Ánh Sáng
                            </h4>
                            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: 'hsl(174 100% 50% / 0.1)',
                                color: 'hsl(174 100% 35%)',
                              }}
                            >
                              {categories.find(c => c.id === post.category)?.label || post.category}
                            </span>
                            {user && post.user_id === user.id && (
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p 
                          className="text-base leading-relaxed mb-4"
                          style={{ color: 'hsl(180 100% 15%)' }}
                        >
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                              userLikes.has(post.id) ? 'bg-pink-100' : 'hover:bg-pink-50'
                            }`}
                          >
                            <Heart 
                              className={`w-4 h-4 ${userLikes.has(post.id) ? 'fill-pink-500 text-pink-500' : 'text-pink-500'}`} 
                            />
                            <span className="text-sm text-pink-600">{post.likes_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.1), hsl(174 100% 42% / 0.05))',
              border: '2px solid hsl(174 100% 50% / 0.2)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6" style={{ color: 'hsl(174 100% 40%)' }} />
              <h3 
                className="font-semibold text-lg"
                style={{ color: 'hsl(174 100% 30%)' }}
              >
                Thống Kê Cộng Đồng
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/50">
                <Users className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(174 100% 40%)' }} />
                <p className="font-bold text-xl" style={{ color: 'hsl(180 100% 20%)' }}>{stats.members.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Thành viên</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/50">
                <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(174 100% 40%)' }} />
                <p className="font-bold text-xl" style={{ color: 'hsl(180 100% 20%)' }}>{stats.posts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Bài chia sẻ</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/50">
                <MessageSquare className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(174 100% 40%)' }} />
                <p className="font-bold text-xl" style={{ color: 'hsl(180 100% 20%)' }}>{stats.interactions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tương tác</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/50">
                <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: 'hsl(350 80% 50%)' }} />
                <p className="font-bold text-xl" style={{ color: 'hsl(180 100% 20%)' }}>{stats.likes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Yêu thích</p>
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.98), hsl(51 100% 98% / 0.95))',
              border: '2px solid hsl(51 100% 50% / 0.2)',
              boxShadow: '0 10px 40px hsl(51 100% 50% / 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6" style={{ color: 'hsl(51 100% 45%)' }} />
              <h3 
                className="font-semibold text-lg"
                style={{ color: 'hsl(51 100% 40%)' }}
              >
                Hướng Dẫn Chia Sẻ
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✨ Chia sẻ những trải nghiệm tâm linh của bạn</li>
              <li>🧘 Chia sẻ phương pháp thiền định hiệu quả</li>
              <li>💖 Truyền cảm hứng yêu thương</li>
              <li>💚 Giúp đỡ mọi người chữa lành</li>
              <li>🙏 Lan tỏa lòng biết ơn</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CommunityWisdom;