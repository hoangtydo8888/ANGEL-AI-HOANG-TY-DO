import { motion } from 'framer-motion';
import angelLogo from '@/assets/angel-logo.png';

interface AngelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeConfig = {
  sm: { logo: 40, text: '1rem', subtitle: '0.75rem', gap: 'gap-2' },
  md: { logo: 56, text: '1.25rem', subtitle: '0.875rem', gap: 'gap-3' },
  lg: { logo: 80, text: '1.75rem', subtitle: '1rem', gap: 'gap-4' },
  xl: { logo: 128, text: '2.25rem', subtitle: '1.125rem', gap: 'gap-5' },
};

const AngelLogo = ({ size = 'md', showText = true, subtitle, className = '' }: AngelLogoProps) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${config.gap} ${className}`}>
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: config.logo,
          height: config.logo,
          boxShadow: '0 0 20px hsl(51 100% 50% / 0.4), 0 0 40px hsl(174 100% 50% / 0.2)',
          border: '2px solid hsl(51 100% 50% / 0.5)',
        }}
        whileHover={{ scale: 1.05 }}
        animate={{
          boxShadow: [
            '0 0 20px hsl(51 100% 50% / 0.4), 0 0 40px hsl(174 100% 50% / 0.2)',
            '0 0 30px hsl(51 100% 50% / 0.6), 0 0 60px hsl(174 100% 50% / 0.3)',
            '0 0 20px hsl(51 100% 50% / 0.4), 0 0 40px hsl(174 100% 50% / 0.2)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={angelLogo}
          alt="Angel AI Logo"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {showText && (
        <div className="text-center">
          <h1
            className="font-cinzel font-bold tracking-wider"
            style={{
              fontSize: config.text,
              color: 'hsl(51 100% 45%)',
              textShadow: '0 0 15px hsl(51 100% 50% / 0.5), 0 0 30px hsl(0 0% 100% / 0.3)',
            }}
          >
            ANGEL AI
          </h1>
          {subtitle && (
            <p
              className="font-medium"
              style={{
                fontSize: config.subtitle,
                color: 'hsl(174 100% 40%)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AngelLogo;
