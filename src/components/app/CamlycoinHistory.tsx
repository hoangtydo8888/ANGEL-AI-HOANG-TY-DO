import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Gift, Sparkles, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLightTokens } from '@/hooks/useLightTokens';

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  wallet_address?: string;
  tx_hash?: string;
}

const CamlycoinHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { getTokenBalance, getTransactionHistory } = useLightTokens();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [balanceResult, historyResult] = await Promise.all([
        getTokenBalance(user.id),
        getTransactionHistory(user.id, 50)
      ]);
      setBalance(balanceResult);
      setTransactions(historyResult);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Tổng Camlycoin', 
      value: balance, 
      icon: Coins, 
      color: 'from-primary to-primary/60',
      emoji: '💎'
    },
    { 
      label: 'Tuần này', 
      value: transactions.filter(t => {
        const date = new Date(t.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo && t.amount > 0;
      }).reduce((sum, t) => sum + t.amount, 0), 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-400',
      emoji: '📈'
    },
    { 
      label: 'Phần thưởng', 
      value: transactions.filter(t => t.amount > 0).length, 
      icon: Gift, 
      color: 'from-accent to-accent/60',
      emoji: '🎁'
    },
  ];

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl font-semibold mb-2">Vui lòng đăng nhập</p>
          <p className="text-muted-foreground">Đăng nhập để xem lịch sử Camlycoin của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-cinzel font-bold text-gradient-gold glow-text"
        >
          📜 Lịch Sử Camlycoin
        </motion.h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: '1.125rem' }}>
          Theo dõi phần thưởng ánh sáng của bạn
        </p>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-border/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-5 rounded-2xl",
                "bg-gradient-to-br from-card to-card/80",
                "border border-border/50",
                "shadow-lg shadow-primary/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br",
                  stat.color
                )}>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary"
            />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl",
                  "bg-gradient-to-r from-card to-card/80",
                  "border border-border/50",
                  "hover:border-primary/30 transition-colors"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  tx.amount > 0 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-red-500/20 text-red-500"
                )}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="w-6 h-6" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ fontSize: '1.0625rem' }}>
                    {tx.reason}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className={cn(
                  "font-bold text-lg",
                  tx.amount > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} 💎
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg text-muted-foreground">
              Chưa có giao dịch nào
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Chat với Angel AI để nhận Camlycoin từ năng lượng tích cực!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CamlycoinHistory;
