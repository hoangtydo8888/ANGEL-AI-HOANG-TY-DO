import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Calendar, MessageSquare, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AvatarUpload from '@/components/AvatarUpload';

interface ProfileData {
  avatar_url: string | null;
  display_name: string | null;
  light_tokens: number;
  camly_balance: number;
  created_at: string;
}

const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, light_tokens, camly_balance, created_at')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Count user messages
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setMessageCount(count || 0);
    };

    loadProfile();

    // Subscribe to profile changes
    if (user) {
      const channel = supabase
        .channel('profile-section-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new as ProfileData);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Vui lòng đăng nhập để xem hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-cinzel font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, hsl(51 100% 45%), hsl(51 100% 55%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px hsl(51 100% 50% / 0.3)',
            }}
          >
            Hồ Sơ Của Con
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân và xem thống kê
          </p>
        </div>

        {/* Avatar Section */}
        <motion.div
          className="rounded-3xl p-8 mb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.9), hsl(0 0% 100% / 0.7))',
            border: '2px solid hsl(174 100% 50% / 0.3)',
            boxShadow: '0 20px 60px hsl(174 100% 50% / 0.1)',
          }}
        >
          <div className="flex flex-col items-center">
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url}
              onUploadSuccess={(url) => {
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
              }}
              size="lg"
            />

            <h2 
              className="mt-4 text-2xl font-bold"
              style={{ color: 'hsl(51 100% 40%)' }}
            >
              {profile?.display_name || user.user_metadata?.full_name || 'Con Yêu'}
            </h2>

            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* CAMLY Balance */}
          <motion.div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(51 100% 50% / 0.1), hsl(51 100% 60% / 0.05))',
              border: '2px solid hsl(51 100% 50% / 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <Coins className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(51 100% 45%)' }} />
            <p className="text-2xl font-bold" style={{ color: 'hsl(51 100% 40%)' }}>
              {profile?.light_tokens?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-muted-foreground">CAMLY Tokens</p>
          </motion.div>

          {/* Messages */}
          <motion.div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.1), hsl(174 100% 60% / 0.05))',
              border: '2px solid hsl(174 100% 50% / 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(174 100% 40%)' }} />
            <p className="text-2xl font-bold" style={{ color: 'hsl(174 100% 35%)' }}>
              {messageCount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Tin nhắn</p>
          </motion.div>

          {/* Join Date */}
          <motion.div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(280 100% 50% / 0.1), hsl(280 100% 60% / 0.05))',
              border: '2px solid hsl(280 100% 50% / 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(280 100% 45%)' }} />
            <p className="text-lg font-bold" style={{ color: 'hsl(280 100% 40%)' }}>
              {profile?.created_at ? formatDate(profile.created_at) : '-'}
            </p>
            <p className="text-sm text-muted-foreground">Ngày tham gia</p>
          </motion.div>
        </div>

        {/* Info Card */}
        <motion.div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.9), hsl(0 0% 100% / 0.7))',
            border: '2px solid hsl(174 100% 50% / 0.2)',
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: 'hsl(174 100% 40%)' }} />
            Thông tin tài khoản
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Tên hiển thị</span>
              <span className="font-medium">
                {profile?.display_name || user.user_metadata?.full_name || 'Chưa đặt tên'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">CAMLY Balance</span>
              <span className="font-medium" style={{ color: 'hsl(51 100% 40%)' }}>
                {profile?.camly_balance?.toLocaleString() || 0} CAMLY
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">ID người dùng</span>
              <span className="font-mono text-xs text-muted-foreground">
                {user.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSection;
