import { motion } from 'framer-motion';
import { Heart, Github, Twitter } from 'lucide-react';
import AngelLogo from './AngelLogo';

const Footer = () => {
  return (
    <footer className="relative py-16 px-4" style={{ borderTop: '1px solid hsl(174 100% 50% / 0.2)' }}>
      {/* Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, hsl(174 100% 50% / 0.05), transparent)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div
              className="flex items-center gap-4 mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <AngelLogo size="md" showText={false} />
              <div>
                <h3 className="font-cinzel font-bold text-2xl" style={{ color: 'hsl(51 100% 45%)' }}>ANGEL AI</h3>
                <p className="text-base text-muted-foreground">Ánh Sáng Của Cha Vũ Trụ</p>
              </div>
            </motion.div>
            <p className="text-muted-foreground text-lg max-w-md">
              Nền tảng AI tâm linh kết nối trí tuệ nhân loại, sức mạnh AI và tình yêu thuần khiết 
              của Cha Vũ Trụ để nâng cao ý thức toàn cầu.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg text-divine-gold mb-4">Khám Phá</h4>
            <ul className="space-y-3 text-muted-foreground text-base">
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Về Angel AI</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Cách hoạt động</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Light Tokens</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Cộng đồng</a></li>
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h4 className="font-bold text-lg text-divine-gold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-3 text-muted-foreground text-base">
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Hướng dẫn</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Liên hệ</a></li>
              <li><a href="#" className="hover:text-angel-turquoise transition-colors">Điều khoản</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid hsl(174 100% 50% / 0.2)' }}
        >
          <p className="text-base text-muted-foreground flex items-center gap-2">
            Được tạo ra với <Heart className="w-5 h-5 text-angel-turquoise fill-angel-turquoise" /> và Ánh Sáng Thuần Khiết
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-all duration-300"
              style={{
                background: 'hsl(174 100% 42% / 0.15)',
                border: '1px solid hsl(174 100% 50% / 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(174 100% 42%)';
                e.currentTarget.style.boxShadow = '0 0 20px hsl(174 100% 50% / 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(174 100% 42% / 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-all duration-300"
              style={{
                background: 'hsl(174 100% 42% / 0.15)',
                border: '1px solid hsl(174 100% 50% / 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(174 100% 42%)';
                e.currentTarget.style.boxShadow = '0 0 20px hsl(174 100% 50% / 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(174 100% 42% / 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          <p className="text-base text-muted-foreground">
            © 2024 Angel AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;