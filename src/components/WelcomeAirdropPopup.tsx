import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeAirdropPopupProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
}

const WelcomeAirdropPopup = ({ isOpen, onClose, amount = 50000 }: WelcomeAirdropPopupProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        color: ['#FFD700', '#00D4C4', '#00FFF0', '#FF69B4', '#7B68EE'][i % 5],
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}
          onClick={onClose}
        >
          {/* Confetti Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 2.5, delay: particle.id * 0.05 }}
              className="absolute w-4 h-4 rounded-full pointer-events-none"
              style={{ backgroundColor: particle.color }}
            />
          ))}

          {/* Main Popup */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative max-w-md w-full rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.95), hsl(174 100% 98% / 0.9))',
              border: '3px solid hsl(51 100% 50% / 0.5)',
              boxShadow: '0 0 60px hsl(51 100% 50% / 0.4), 0 0 120px hsl(174 100% 50% / 0.3)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-primary/10 transition-colors z-10"
            >
              <X className="w-6 h-6" style={{ color: 'hsl(180 100% 20%)' }} />
            </button>

            {/* Halo Effect Background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, hsl(51 100% 50% / 0.2) 0%, transparent 70%)',
              }}
            />

            <div className="relative p-8 text-center">
              {/* Glowing Icon */}
              <motion.div
                className="w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(51 100% 60%))',
                }}
                animate={{
                  boxShadow: [
                    '0 0 40px hsl(51 100% 50% / 0.5), 0 0 80px hsl(174 100% 50% / 0.3)',
                    '0 0 80px hsl(51 100% 50% / 0.8), 0 0 120px hsl(174 100% 50% / 0.5)',
                    '0 0 40px hsl(51 100% 50% / 0.5), 0 0 80px hsl(174 100% 50% / 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-14 h-14 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="font-serif font-black mb-2"
                style={{
                  fontSize: '2rem',
                  color: 'hsl(51 100% 45%)',
                  textShadow: '0 0 20px hsl(51 100% 50% / 0.6), 0 0 40px hsl(0 0% 100% / 0.8)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to the Light! ✨
              </motion.h2>

              <motion.p
                className="mb-6 font-semibold"
                style={{ fontSize: '1.25rem', color: 'hsl(180 100% 20%)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Cha Vũ Trụ ban tặng con
              </motion.p>

              {/* Amount Display */}
              <motion.div
                className="py-6 px-8 rounded-2xl mb-6"
                style={{
                  background: 'linear-gradient(135deg, hsl(51 100% 50% / 0.15), hsl(174 100% 50% / 0.1))',
                  border: '2px solid hsl(51 100% 50% / 0.3)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                <div className="flex items-center justify-center gap-4">
                  <Coins className="w-10 h-10" style={{ color: 'hsl(51 100% 50%)' }} />
                  <span
                    className="font-black balance-number"
                    style={{
                      fontSize: '3rem',
                      color: 'hsl(51 100% 45%)',
                      textShadow: '0 0 15px hsl(51 100% 50% / 0.5)',
                    }}
                  >
                    {formatNumber(amount)}
                  </span>
                  <span
                    className="font-bold"
                    style={{ fontSize: '1.5rem', color: 'hsl(180 100% 20%)' }}
                  >
                    CAMLY
                  </span>
                </div>
              </motion.div>

              {/* Message */}
              <motion.p
                className="mb-8 font-semibold"
                style={{ fontSize: '1.125rem', color: 'hsl(180 100% 25%)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Đây là phước lành chào mừng từ Cha Vũ Trụ. <br />
                Hãy lan tỏa ánh sáng và nhận thêm nhiều CAMLY! 🌟
              </motion.p>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="btn-camly w-full py-6 text-lg"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  Nhận Phước Lành
                </Button>
              </motion.div>

              {/* Footer Note */}
              <motion.p
                className="mt-4 text-sm"
                style={{ color: 'hsl(180 100% 30%)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                ✨ Cha luôn bên con ✨
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeAirdropPopup;
