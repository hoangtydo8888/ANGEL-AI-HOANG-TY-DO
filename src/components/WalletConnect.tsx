import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, Coins, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletConnectProps {
  variant?: 'header' | 'full';
}

const WalletConnect = ({ variant = 'header' }: WalletConnectProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lightTokens, setLightTokens] = useState(0);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load light tokens from database when user is logged in
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('light_tokens')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setLightTokens(data.light_tokens);
        }
      }
    };
    
    loadUserData();

    // Subscribe to realtime updates
    if (user) {
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && 'light_tokens' in payload.new) {
              setLightTokens(payload.new.light_tokens as number);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length > 0) {
        setAddress(accountsArray[0]);
      } else {
        setAddress(null);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Vui lòng cài đặt MetaMask để kết nối ví');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        toast.success('🌟 Kết nối ví thành công! Ánh sáng đang lan tỏa đến bạn.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Không thể kết nối ví. Vui lòng thử lại.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    toast.info('Đã ngắt kết nối ví');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Đã đăng xuất. Ánh sáng vẫn luôn bên bạn! ✨');
    navigate('/');
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-3">
        {/* Light Tokens - Show if logged in */}
        {user && (
          <motion.button
            onClick={() => setShowTokenModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-angel-gold/10 text-angel-gold text-sm font-medium hover:bg-angel-gold/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Coins className="w-4 h-4" />
            <span>{lightTokens} LIGHT</span>
          </motion.button>
        )}

        {/* Wallet Connect */}
        {address ? (
          <motion.button
            onClick={disconnectWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 text-sm font-medium hover:border-angel-gold/30 transition-colors group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{formatAddress(address)}</span>
            <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ) : (
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Ví
          </Button>
        )}

        {/* Auth Button */}
        {user ? (
          <motion.button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 text-sm hover:border-destructive/30 hover:text-destructive transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <LogOut className="w-3 h-3" />
          </motion.button>
        ) : (
          <Button
            onClick={() => navigate('/auth')}
            className="btn-divine text-sm py-2 px-4"
          >
            Đăng Nhập
          </Button>
        )}

        {/* Token Modal */}
        <AnimatePresence>
          {showTokenModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTokenModal(false)}
            >
              <motion.div
                className="glass-divine rounded-3xl p-8 max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  {/* Token Icon */}
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-angel-gold to-angel-gold-light flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 30px hsl(var(--angel-gold) / 0.4)',
                        '0 0 60px hsl(var(--angel-gold) / 0.6)',
                        '0 0 30px hsl(var(--angel-gold) / 0.4)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Coins className="w-10 h-10 text-background" />
                  </motion.div>

                  <h3 className="font-serif text-2xl font-bold mb-2">Light Tokens</h3>
                  <p className="text-muted-foreground mb-6">
                    Phước lành từ Cha Vũ Trụ cho năng lượng tích cực của bạn
                  </p>

                  {/* Balance */}
                  <div className="bg-card rounded-2xl p-6 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Số dư hiện tại</p>
                    <p className="text-4xl font-bold text-gradient-gold">{lightTokens} LIGHT</p>
                  </div>

                  {/* Wallet Info */}
                  {address && (
                    <div className="bg-card rounded-xl p-4 mb-6 text-left">
                      <p className="text-xs text-muted-foreground mb-1">Ví kết nối</p>
                      <p className="font-mono text-sm">{formatAddress(address)}</p>
                    </div>
                  )}

                  {/* Info */}
                  <p className="text-sm text-muted-foreground mb-6">
                    Bạn nhận được Light Tokens khi lan tỏa năng lượng tích cực, 
                    hỏi những câu hỏi có chiều sâu tâm linh, hoặc giúp đỡ người khác.
                  </p>

                  <Button
                    onClick={() => setShowTokenModal(false)}
                    className="btn-divine w-full"
                  >
                    Tiếp Tục Lan Tỏa Ánh Sáng
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant for standalone use
  return (
    <div className="glass-divine rounded-3xl p-8 text-center">
      <motion.div
        className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-angel-gold to-angel-gold-light flex items-center justify-center"
        animate={{
          boxShadow: [
            '0 0 20px hsl(var(--angel-gold) / 0.4)',
            '0 0 40px hsl(var(--angel-gold) / 0.6)',
            '0 0 20px hsl(var(--angel-gold) / 0.4)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Wallet className="w-8 h-8 text-background" />
      </motion.div>

      <h3 className="font-serif text-xl font-bold mb-2">Web3 Wallet</h3>
      <p className="text-muted-foreground mb-6">
        Kết nối ví để nhận Light Tokens – phước lành từ Cha Vũ Trụ
      </p>

      {address ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span>Đã kết nối</span>
          </div>
          <p className="font-mono text-sm bg-card rounded-lg px-4 py-2">
            {formatAddress(address)}
          </p>
          <Button variant="outline" onClick={disconnectWallet}>
            Ngắt kết nối
          </Button>
        </div>
      ) : (
        <Button onClick={connectWallet} disabled={isConnecting} className="btn-divine">
          {isConnecting ? 'Đang kết nối...' : 'Kết Nối MetaMask'}
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
