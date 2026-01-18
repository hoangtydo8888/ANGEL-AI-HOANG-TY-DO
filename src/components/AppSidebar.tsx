import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageCircle, 
  Coins, 
  Mic, 
  Sparkles, 
  FolderOpen, 
  History, 
  Wand2, 
  Trophy, 
  Gem, 
  BookOpen, 
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AngelLogo from './AngelLogo';

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

const menuItems = [
  { id: 'search', icon: Search, label: 'Tìm kiếm', emoji: '🔍', path: '/app/search' },
  { id: 'chat', icon: MessageCircle, label: 'Chat', emoji: '💬', path: '/app/chat' },
  { id: 'community-wisdom', icon: MessageCircle, label: 'Trí Tuệ Nhân Loại', emoji: '🧠', path: '/app/community-wisdom' },
  { id: 'multi-ai', icon: MessageCircle, label: 'Hợp Nhất Đa AI', emoji: '🤖', path: '/app/multi-ai' },
  { id: 'divine-healing', icon: MessageCircle, label: 'Chữa Lành Thiêng Liêng', emoji: '💖', path: '/app/divine-healing' },
  { id: 'camly-rewards', icon: Coins, label: 'CAMLY Rewards', emoji: '🪙', path: '/app/camly-rewards' },
  { id: 'camlycoin-history', icon: History, label: 'Lịch Sử Camlycoin', emoji: '📜', path: '/app/camlycoin-history' },
  { id: 'voice', icon: Mic, label: 'Chế độ thoại', emoji: '🎤', path: '/app/voice' },
  { id: 'imagine', icon: Sparkles, label: 'Imagine', emoji: '✨', path: '/app/imagine' },
  { id: 'projects', icon: FolderOpen, label: 'Dự án', emoji: '📂', path: '/app/projects' },
  { id: 'ai-tools', icon: Wand2, label: 'AI Tools', emoji: '🔮', path: '/app/ai-tools' },
  { id: 'bounty', icon: Trophy, label: 'Build & Bounty', emoji: '🏆', path: '/app/bounty' },
  { id: 'camlycoin', icon: Gem, label: 'Camlycoin', emoji: '💎', path: '/app/camlycoin' },
  { id: 'knowledge', icon: BookOpen, label: 'Knowledge', emoji: '📚', path: '/app/knowledge' },
  { id: 'settings', icon: Settings, label: 'Cài Đặt', emoji: '⚙️', path: '/app/settings' },
];

const AppSidebar = ({ isOpen, onToggle, onNavigate, currentSection = 'chat' }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 320 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "fixed left-0 top-0 h-full z-50 overflow-hidden",
          "lg:relative"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.98), hsl(174 100% 98% / 0.95))',
          borderRight: '2px solid hsl(174 100% 50% / 0.2)',
          boxShadow: '10px 0 40px hsl(174 100% 50% / 0.1)',
        }}
      >
        <div className="flex flex-col h-full w-[320px]">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-5 border-b"
            style={{ borderColor: 'hsl(174 100% 50% / 0.2)' }}
          >
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AngelLogo size="md" showText={false} />
              <div>
                <h2 
                  className="font-cinzel font-bold"
                  style={{
                    fontSize: '1.75rem',
                    color: 'hsl(51 100% 45%)',
                    textShadow: '0 0 15px hsl(51 100% 50% / 0.5), 0 0 30px hsl(0 0% 100% / 0.5)',
                  }}
                >
                  ANGEL AI
                </h2>
                <p 
                  style={{ 
                    fontSize: '1rem',
                    color: 'hsl(174 100% 40%)',
                  }}
                >
                  Ánh Sáng Yêu Thương Thuần Khiết Của Cha
                </p>
              </div>
            </motion.div>
            
            <button
              onClick={onToggle}
              className="p-3 rounded-full hover:bg-angel-turquoise/10 transition-colors lg:hidden"
            >
              <X className="w-6 h-6" style={{ color: 'hsl(174 100% 40%)' }} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div 
              className="p-5 border-b"
              style={{ borderColor: 'hsl(174 100% 50% / 0.2)' }}
            >
              <div 
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(174 100% 50% / 0.1), hsl(174 100% 42% / 0.05))',
                  border: '2px solid hsl(174 100% 50% / 0.2)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 60%))',
                    boxShadow: '0 0 15px hsl(51 100% 50% / 0.4)',
                  }}
                >
                  <span className="text-xl">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-bold truncate"
                    style={{ 
                      fontSize: '1.25rem',
                      color: 'hsl(51 100% 45%)',
                    }}
                  >
                    {user.email?.split('@')[0]}
                  </p>
                  <p 
                    style={{ 
                      fontSize: '1rem',
                      color: 'hsl(174 100% 40%)',
                    }}
                  >
                    Con Yêu Của Cha
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items - Doubled size with bold gold */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item, index) => {
              const isActive = currentSection === item.id;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl",
                    "transition-all duration-300 group relative overflow-hidden",
                    "text-left"
                  )}
                  style={{
                    background: isActive 
                      ? 'linear-gradient(135deg, hsl(174 100% 50% / 0.15), hsl(174 100% 42% / 0.1))'
                      : 'transparent',
                    border: isActive 
                      ? '2px solid hsl(174 100% 50% / 0.3)' 
                      : '2px solid transparent',
                    boxShadow: isActive 
                      ? '0 0 20px hsl(174 100% 50% / 0.2)'
                      : 'none',
                  }}
                >
                  {/* Icon */}
                  <div 
                    className="flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300"
                    style={{
                      background: isActive 
                        ? 'linear-gradient(135deg, hsl(174 100% 50%), hsl(174 100% 42%))'
                        : 'hsl(174 100% 50% / 0.1)',
                      boxShadow: isActive 
                        ? '0 0 20px hsl(174 100% 50% / 0.4)'
                        : 'none',
                    }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                  </div>

                  {/* Label - Deep Sacred Turquoise #006666 */}
                  <span 
                    className="font-extrabold tracking-wide"
                    style={{
                      fontSize: '1.25rem',
                      color: isActive ? 'hsl(180 100% 20%)' : 'hsl(180 100% 25%)',
                      textShadow: isActive 
                        ? '0 0 10px hsl(174 100% 50% / 0.3)'
                        : 'none',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-4 w-3 h-3 rounded-full"
                      style={{
                        background: 'hsl(174 100% 50%)',
                        boxShadow: '0 0 10px hsl(174 100% 50%)',
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Admin Button */}
          {isAdmin && (
            <div className="p-4 border-t" style={{ borderColor: 'hsl(174 100% 50% / 0.2)' }}>
              <motion.button
                onClick={handleAdminClick}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, hsl(280 100% 50% / 0.15), hsl(280 100% 42% / 0.1))',
                  border: '2px solid hsl(280 100% 50% / 0.3)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="flex items-center justify-center w-14 h-14 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, hsl(280 100% 50%), hsl(280 100% 42%))',
                    boxShadow: '0 0 20px hsl(280 100% 50% / 0.4)',
                  }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span 
                  className="font-bold tracking-wide"
                  style={{
                    fontSize: '1.5rem',
                    color: 'hsl(280 100% 70%)',
                    textShadow: '0 0 15px hsl(280 100% 50% / 0.5)',
                  }}
                >
                  Admin Panel
                </span>
              </motion.button>
            </div>
          )}

          {/* Footer */}
          <div 
            className="p-5 border-t"
            style={{ borderColor: 'hsl(174 100% 50% / 0.2)' }}
          >
            <div className="text-center">
              <p 
                className="font-semibold"
                style={{ 
                  fontSize: '1rem',
                  color: 'hsl(51 100% 50% / 0.8)',
                }}
              >
                ✨ Cha luôn bên con ✨
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle Button (Desktop) */}
      <motion.button
        initial={false}
        animate={{ 
          left: isOpen ? 280 : 0,
          opacity: 1 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onClick={onToggle}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50",
          "w-8 h-16 rounded-r-xl",
          "bg-gradient-to-r from-card to-card/90",
          "border border-l-0 border-border/50",
          "flex items-center justify-center",
          "hover:bg-muted/50 transition-colors",
          "shadow-lg shadow-primary/10",
          "hidden lg:flex"
        )}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-primary" />
        )}
      </motion.button>
    </>
  );
};

export default AppSidebar;
