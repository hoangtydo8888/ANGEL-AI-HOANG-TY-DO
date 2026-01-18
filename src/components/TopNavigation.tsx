import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, User, LogOut, Settings, History, Coins, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const TopNavigation = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lightTokens, setLightTokens] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [tokenDiff, setTokenDiff] = useState(0);
  const [showTokenAnimation, setShowTokenAnimation] = useState(false);
  const prevTokensRef = useRef(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load light tokens and avatar
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('light_tokens, avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setLightTokens(data.light_tokens);
          prevTokensRef.current = data.light_tokens;
          setAvatarUrl(data.avatar_url);
        }
      }
    };
    
    loadUserData();

    if (user) {
      const channel = supabase
        .channel('profile-changes-nav')
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
              // Handle avatar update
              if ('avatar_url' in payload.new) {
                setAvatarUrl(payload.new.avatar_url as string | null);
              }
              
              // Handle token update with animation
              if ('light_tokens' in payload.new) {
                const newTokens = payload.new.light_tokens as number;
                const diff = newTokens - prevTokensRef.current;
                
                if (diff > 0) {
                  setTokenDiff(diff);
                  setShowTokenAnimation(true);
                  setTimeout(() => setShowTokenAnimation(false), 2000);
                }
                
                prevTokensRef.current = newTokens;
                setLightTokens(newTokens);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Check wallet connection
  useEffect(() => {
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
        toast.success('🌟 Kết nối ví thành công!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Không thể kết nối ví. Vui lòng thử lại.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Đã đăng xuất. Ánh sáng vẫn luôn bên con! ✨');
    navigate('/');
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
      {/* Wallet Connect Button */}
      <motion.button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 px-3 py-2 rounded-full transition-all"
        style={{
          background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.2), hsl(174 100% 42% / 0.1))',
          border: '1.5px solid hsl(174 100% 50% / 0.4)',
          boxShadow: '0 0 20px hsl(174 100% 50% / 0.3)',
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(174 100% 50% / 0.5)' }}
        whileTap={{ scale: 0.95 }}
      >
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))',
            boxShadow: '0 0 10px hsl(174 100% 50% / 0.5)',
          }}
        >
          <Wallet className="w-3.5 h-3.5 text-white" />
        </div>
        <span 
          className="font-bold"
          style={{ 
            fontSize: '0.85rem',
            color: 'hsl(51 100% 45%)',
            textShadow: '0 0 8px hsl(51 100% 50% / 0.5)',
          }}
        >
          {address ? formatAddress(address) : 'Kết Nối Ví'}
        </span>
      </motion.button>

      {/* User Profile Button */}
      <div className="relative">
        <motion.button
          onClick={() => user ? setShowProfileMenu(!showProfileMenu) : navigate('/auth')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all"
          style={{
            background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.2), hsl(174 100% 42% / 0.1))',
            border: '1.5px solid hsl(174 100% 50% / 0.4)',
            boxShadow: '0 0 20px hsl(174 100% 50% / 0.3)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(174 100% 50% / 0.5)' }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Avatar with Halo */}
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(174 100% 50% / 0.4), transparent 70%)',
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div 
              className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 60%))',
                boxShadow: '0 0 12px hsl(51 100% 50% / 0.5)',
              }}
            >
              {user ? (
                avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-lg">👤</span>
                )
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Token Animation */}
            <AnimatePresence>
              {showTokenAnimation && tokenDiff > 0 && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none z-50"
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -30, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                >
                  <span 
                    className="font-bold whitespace-nowrap"
                    style={{
                      fontSize: '0.9rem',
                      color: 'hsl(120 100% 40%)',
                      textShadow: '0 0 10px hsl(120 100% 50% / 0.8), 0 0 20px hsl(120 100% 50% / 0.5), 0 0 30px hsl(120 100% 50% / 0.3)',
                    }}
                  >
                    +{tokenDiff} CAMLY ✨
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {user && (
            <>
              <div className="text-left">
                <p 
                  className="font-bold"
                  style={{ 
                    fontSize: '0.85rem',
                    color: 'hsl(51 100% 45%)',
                    textShadow: '0 0 8px hsl(51 100% 50% / 0.5)',
                  }}
                >
                  {user.user_metadata?.full_name || 'Con Yêu'}
                </p>
                <p 
                  className="flex items-center gap-1"
                  style={{ 
                    fontSize: '0.75rem',
                    color: 'hsl(174 100% 40%)',
                  }}
                >
                  <Coins className="w-3 h-3" />
                  {lightTokens} CAMLY
                </p>
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                style={{ color: 'hsl(51 100% 45%)' }}
              />
            </>
          )}
        </motion.button>

        {/* Profile Dropdown Menu */}
        <AnimatePresence>
          {showProfileMenu && user && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-64 rounded-2xl overflow-hidden"
              style={{
                background: 'hsl(0 0% 100% / 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid hsl(174 100% 50% / 0.3)',
                boxShadow: '0 20px 60px hsl(174 100% 50% / 0.2)',
              }}
            >
              <div className="p-3 border-b border-angel-turquoise/20">
                <p 
                  className="font-bold text-center"
                  style={{ 
                    fontSize: '1rem',
                    color: 'hsl(51 100% 45%)',
                  }}
                >
                  {lightTokens} CAMLY
                </p>
              </div>

              {[
                { icon: User, label: 'Hồ Sơ', action: () => navigate('/app/profile') },
                { icon: History, label: 'Lịch Sử CAMLY', action: () => navigate('/app/camlycoin') },
                { icon: Settings, label: 'Cài Đặt', action: () => navigate('/app/settings') },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-angel-turquoise/10 transition-colors"
                >
                  <item.icon className="w-5 h-5" style={{ color: 'hsl(174 100% 40%)' }} />
                  <span 
                    className="font-semibold"
                    style={{ 
                      fontSize: '1.1rem',
                      color: 'hsl(51 100% 40%)',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}

              <button
                onClick={() => {
                  handleSignOut();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border-t border-angel-turquoise/20 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-500" style={{ fontSize: '1.1rem' }}>
                  Đăng Xuất
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TopNavigation;
