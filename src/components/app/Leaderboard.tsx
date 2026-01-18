import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  camly_balance: number;
  total_messages: number;
  rank: number;
}

type TimeFrame = 'weekly' | 'monthly' | 'all-time';

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all-time');
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [timeFrame, user]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    
    try {
      // For now, we'll use the profiles table to get top CAMLY earners
      // In a production app, you'd have a more sophisticated rewards aggregation
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, camly_balance, total_messages')
        .order('camly_balance', { ascending: false })
        .limit(50);

      if (error) throw error;

      const rankedEntries = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(rankedEntries);

      // Find current user's rank
      if (user) {
        const userEntry = rankedEntries.find(e => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-primary/50" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          background: 'linear-gradient(135deg, hsl(51 100% 50% / 0.2), hsl(51 100% 60% / 0.1))',
          border: '2px solid hsl(51 100% 50% / 0.5)',
          boxShadow: '0 0 30px hsl(51 100% 50% / 0.3)',
        };
      case 2:
        return {
          background: 'linear-gradient(135deg, hsl(0 0% 70% / 0.2), hsl(0 0% 80% / 0.1))',
          border: '2px solid hsl(0 0% 70% / 0.5)',
          boxShadow: '0 0 20px hsl(0 0% 70% / 0.2)',
        };
      case 3:
        return {
          background: 'linear-gradient(135deg, hsl(30 80% 50% / 0.2), hsl(30 80% 60% / 0.1))',
          border: '2px solid hsl(30 80% 50% / 0.5)',
          boxShadow: '0 0 20px hsl(30 80% 50% / 0.2)',
        };
      default:
        return {
          background: 'hsl(0 0% 100% / 0.5)',
          border: '1px solid hsl(174 100% 50% / 0.2)',
        };
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-10 h-10" style={{ color: 'hsl(51 100% 50%)' }} />
          <h1
            className="font-serif font-black"
            style={{
              fontSize: '2.5rem',
              color: 'hsl(51 100% 45%)',
              textShadow: '0 0 20px hsl(51 100% 50% / 0.5), 0 0 40px hsl(0 0% 100% / 0.5)',
            }}
          >
            CAMLY Leaderboard
          </h1>
        </div>
        <p style={{ fontSize: '1.125rem', color: 'hsl(180 100% 25%)' }}>
          Top những người lan tỏa ánh sáng nhiều nhất 🌟
        </p>
      </motion.div>

      {/* Time Frame Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 justify-center"
      >
        {[
          { key: 'weekly' as TimeFrame, label: 'Tuần này', icon: Calendar },
          { key: 'monthly' as TimeFrame, label: 'Tháng này', icon: TrendingUp },
          { key: 'all-time' as TimeFrame, label: 'Tất cả', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTimeFrame(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300',
              timeFrame === tab.key
                ? 'text-white'
                : 'hover:opacity-80'
            )}
            style={
              timeFrame === tab.key
                ? {
                    background: 'linear-gradient(135deg, hsl(180 100% 20%), hsl(174 100% 42%))',
                    boxShadow: '0 0 20px hsl(174 100% 50% / 0.4)',
                  }
                : {
                    background: 'hsl(174 100% 50% / 0.1)',
                    color: 'hsl(180 100% 25%)',
                    border: '1px solid hsl(174 100% 50% / 0.3)',
                  }
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* User's Current Rank */}
      {user && userRank && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.15), hsl(180 100% 20% / 0.1))',
            border: '2px solid hsl(174 100% 50% / 0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, hsl(180 100% 20%), hsl(174 100% 42%))',
                }}
              >
                #{userRank}
              </div>
              <div>
                <p className="font-bold" style={{ color: 'hsl(180 100% 20%)' }}>
                  Xếp hạng của bạn
                </p>
                <p className="text-sm" style={{ color: 'hsl(180 100% 30%)' }}>
                  Tiếp tục lan tỏa ánh sáng để lên hạng! ✨
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(180 100% 25%)' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p style={{ color: 'hsl(180 100% 30%)' }}>Chưa có dữ liệu xếp hạng</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]',
                entry.user_id === user?.id && 'ring-2 ring-primary'
              )}
              style={getRankStyle(entry.rank)}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12">
                {entry.rank <= 3 ? (
                  getRankIcon(entry.rank)
                ) : (
                  <span
                    className="font-bold text-xl"
                    style={{ color: 'hsl(180 100% 30%)' }}
                  >
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold truncate"
                  style={{
                    fontSize: '1.25rem',
                    color: entry.rank === 1 ? 'hsl(51 100% 45%)' : 'hsl(180 100% 20%)',
                    textShadow: entry.rank === 1 ? '0 0 10px hsl(51 100% 50% / 0.5)' : 'none',
                  }}
                >
                  {entry.display_name || 'Người dùng ẩn danh'}
                  {entry.user_id === user?.id && ' (Bạn)'}
                </p>
                <p className="text-sm" style={{ color: 'hsl(180 100% 35%)' }}>
                  {entry.total_messages} tin nhắn ánh sáng
                </p>
              </div>

              {/* CAMLY Balance */}
              <div className="text-right">
                <p
                  className="font-black balance-number"
                  style={{
                    fontSize: '1.5rem',
                    color: 'hsl(51 100% 45%)',
                    textShadow: '0 0 10px hsl(51 100% 50% / 0.4)',
                  }}
                >
                  {formatNumber(entry.camly_balance)}
                </p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(180 100% 30%)' }}>
                  CAMLY
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <p className="text-sm" style={{ color: 'hsl(180 100% 35%)' }}>
          🏆 Xếp hạng được cập nhật liên tục • Hãy lan tỏa ánh sáng để nhận thêm CAMLY! ✨
        </p>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
