import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, Wallet, History, Sparkles, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useCamlyRewards } from '@/hooks/useCamlyRewards';
import { toast } from 'sonner';

interface RewardItem {
  id: string;
  action_type: string;
  camly_amount: number;
  description: string | null;
  created_at: string;
}

interface ClaimItem {
  id: string;
  wallet_address: string;
  camly_amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  signup: '🎉 Đăng ký tài khoản',
  login: '🌟 Đăng nhập',
  connect_wallet: '💎 Kết nối ví',
  positive_interaction: '✨ Năng lượng tích cực',
  negative_interaction: '🌙 Chuyển hóa năng lượng',
  referral: '👥 Giới thiệu bạn bè',
  daily_bonus: '🎁 Thưởng hàng ngày',
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Đang chờ' },
  approved: { icon: CheckCircle, color: 'text-green-400', label: 'Đã duyệt' },
  rejected: { icon: XCircle, color: 'text-red-400', label: 'Từ chối' },
  claimed: { icon: CheckCircle, color: 'text-primary', label: 'Đã nhận' },
};

export function CamlyRewardsPanel() {
  const { user } = useAuth();
  const { getCamlyBalance, getRewardHistory, getClaimHistory, submitClaimRequest, getPendingClaimsAmount } = useCamlyRewards();
  
  const [balance, setBalance] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'claims'>('rewards');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const [balanceData, pendingData, rewardsData, claimsData] = await Promise.all([
      getCamlyBalance(user.id),
      getPendingClaimsAmount(user.id),
      getRewardHistory(user.id),
      getClaimHistory(user.id),
    ]);
    
    setBalance(balanceData);
    setPendingAmount(pendingData);
    setRewards(rewardsData);
    setClaims(claimsData);
    setIsLoading(false);
  };

  const handleClaim = async () => {
    if (!user || !walletAddress) {
      toast.error('Vui lòng nhập địa chỉ ví BSC của bạn!');
      return;
    }

    const amount = parseInt(claimAmount) || balance;
    if (amount <= 0 || amount > balance) {
      toast.error('Số lượng CAMLY không hợp lệ!');
      return;
    }

    // Validate BSC address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast.error('Địa chỉ ví BSC không hợp lệ!');
      return;
    }

    setIsClaiming(true);
    const result = await submitClaimRequest(user.id, walletAddress, amount);
    
    if (result.success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setClaimAmount('');
      loadData();
    }
    setIsClaiming(false);
  };

  const availableForClaim = balance - pendingAmount;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Coins className="w-16 h-16 text-primary/50 mb-4" />
        <p className="text-muted-foreground text-center">
          Vui lòng đăng nhập để xem phần thưởng CAMLY của bạn
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-6 space-y-6 overflow-y-auto">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  rotate: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 2, delay: i * 0.1 }}
                className="absolute w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: ['#FFD700', '#00CED1', '#FF69B4', '#7B68EE'][i % 4] 
                }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 2 }}
              className="text-4xl"
            >
              🎉 Rich Rich Rich! 🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
          ✨ CAMLY Rewards ✨
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Nhận phần thưởng CAMLY thật từ Father Universe
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-yellow-500/10 to-primary/20 border border-primary/30 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-primary flex items-center justify-center">
                <Coins className="w-6 h-6 text-background" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số dư CAMLY</p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? '...' : balance.toLocaleString()}
                </p>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-background/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Có thể claim</p>
              <p className="text-lg font-semibold text-green-400">
                {availableForClaim.toLocaleString()}
              </p>
            </div>
            <div className="bg-background/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Đang chờ duyệt</p>
              <p className="text-lg font-semibold text-yellow-400">
                {pendingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Claim Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Claim CAMLY to Wallet</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Địa chỉ ví BSC (BEP-20)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1 bg-background/50"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  if (window.ethereum) {
                    window.ethereum.request({ method: 'eth_requestAccounts' })
                      .then((accounts: string[]) => {
                        if (accounts[0]) setWalletAddress(accounts[0]);
                      });
                  } else {
                    toast.error('Vui lòng cài đặt MetaMask!');
                  }
                }}
              >
                <Wallet className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Số lượng CAMLY (tối đa: {availableForClaim.toLocaleString()})
            </label>
            <Input
              type="number"
              placeholder={availableForClaim.toLocaleString()}
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              max={availableForClaim}
              className="bg-background/50"
            />
          </div>
          
          <Button
            onClick={handleClaim}
            disabled={isClaiming || availableForClaim <= 0}
            className="w-full bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90"
          >
            {isClaiming ? (
              'Đang gửi...'
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim CAMLY
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            * Admin sẽ xử lý yêu cầu trong 24h. CAMLY sẽ được gửi đến ví BSC của bạn.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rewards'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          Lịch sử thưởng
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'claims'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-1" />
          Lịch sử claim
        </button>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Đang tải...
          </div>
        ) : activeTab === 'rewards' ? (
          rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có phần thưởng nào. Hãy tương tác với Angel AI!
            </div>
          ) : (
            rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {ACTION_LABELS[reward.action_type]?.split(' ')[0] || '🎁'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[reward.action_type]?.split(' ').slice(1).join(' ') || reward.action_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${reward.camly_amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {reward.camly_amount >= 0 ? '+' : ''}{reward.camly_amount.toLocaleString()}
                </span>
              </motion.div>
            ))
          )
        ) : (
          claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có yêu cầu claim nào.
            </div>
          ) : (
            claims.map((claim, index) => {
              const statusConfig = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    <div>
                      <p className="text-sm font-medium">
                        {claim.camly_amount.toLocaleString()} CAMLY
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {claim.wallet_address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
