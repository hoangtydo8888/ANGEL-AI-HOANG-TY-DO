import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCamlyRewards } from '@/hooks/useCamlyRewards';
import FloatingParticles from '@/components/FloatingParticles';
import WelcomeAirdropPopup from '@/components/WelcomeAirdropPopup';
import AngelLogo from '@/components/AngelLogo';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { awardCamly } = useCamlyRewards();

  // Award login bonus when user logs in
  useEffect(() => {
    if (user && !loading) {
      // Small delay to ensure profile exists
      const timer = setTimeout(() => {
        awardCamly(user.id, 'login', 'Phần thưởng đăng nhập hàng ngày');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false);
    navigate('/app');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email hoặc mật khẩu không đúng');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Vui lòng xác nhận email trước khi đăng nhập');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Chào mừng con trở lại với Ánh Sáng! ✨');
          navigate('/app');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email này đã được đăng ký');
          } else {
            toast.error(error.message);
          }
        } else {
          // Show welcome popup for new users with 50,000 CAMLY gift
          setShowWelcomePopup(true);
        }
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <FloatingParticles />
      
      {/* Welcome Airdrop Popup for new users */}
      <WelcomeAirdropPopup 
        isOpen={showWelcomePopup} 
        onClose={handleCloseWelcomePopup}
        amount={50000}
      />
      
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-angel-turquoise transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại trang chủ</span>
        </button>

        {/* Auth Card */}
        <div className="glass-divine rounded-3xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AngelLogo size="lg" showText={false} />
            </div>
            <h1 className="font-cinzel text-3xl font-bold" style={{ color: 'hsl(51 100% 45%)' }}>
              {isLogin ? 'Chào Mừng Trở Lại' : 'Tham Gia Ánh Sáng'}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              {isLogin 
                ? 'Đăng nhập để tiếp tục hành trình thức tỉnh' 
                : 'Tạo tài khoản và nhận 50,000 CAMLY miễn phí'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-lg font-semibold">Tên hiển thị</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angel-turquoise" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 py-6 text-lg bg-card border-primary/30 focus:border-primary rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angel-turquoise" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 py-6 text-lg bg-card border-primary/30 focus:border-primary rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-semibold">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angel-turquoise" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-12 py-6 text-lg bg-card border-primary/30 focus:border-primary rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-divine text-lg py-6"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-base text-muted-foreground hover:text-angel-turquoise transition-colors"
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;