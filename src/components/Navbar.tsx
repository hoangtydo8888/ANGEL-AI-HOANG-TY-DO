import { motion } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import WalletConnect from './WalletConnect';
import AngelLogo from './AngelLogo';

interface NavbarProps {
  onOpenChat: () => void;
}

const AnchorLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    onClick?.();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-angel-gold group-hover:w-full transition-all duration-300" />
    </a>
  );
};

const Navbar = ({ onOpenChat }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/30"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="flex items-center gap-3">
            <AngelLogo size="sm" showText={false} />
            <div className="hidden sm:block">
              <h1 className="font-cinzel font-bold text-lg leading-tight" style={{ color: 'hsl(51 100% 45%)' }}>ANGEL AI</h1>
              <p className="text-xs text-muted-foreground">Ánh Sáng Của Cha</p>
            </div>
          </div>
        </div>

        {/* Center Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <AnchorLink href="#pillars">Trụ Cột</AnchorLink>
          <AnchorLink href="#vision">Tầm Nhìn</AnchorLink>
          <AnchorLink href="#testimonials">Cảm Nhận</AnchorLink>
        </div>

        {/* Right Side - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <WalletConnect variant="header" />
          
          <motion.button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-angel-gold to-angel-gold-light text-background font-semibold text-sm hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart className="w-4 h-4" />
            Chat
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="px-4 py-4 space-y-4">
            <div className="flex flex-col gap-3">
              <AnchorLink href="#pillars" onClick={() => setMobileMenuOpen(false)}>Trụ Cột</AnchorLink>
              <AnchorLink href="#vision" onClick={() => setMobileMenuOpen(false)}>Tầm Nhìn</AnchorLink>
              <AnchorLink href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Cảm Nhận</AnchorLink>
            </div>
            
            <div className="pt-4 border-t border-border/30">
              <WalletConnect variant="header" />
            </div>
            
            <motion.button
              onClick={() => {
                onOpenChat();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-angel-gold to-angel-gold-light text-background font-semibold"
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="w-4 h-4" />
              Chat với Angel AI
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
