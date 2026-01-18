import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Apple, Chrome, Share, PlusSquare, MoreVertical, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AngelLogo from "@/components/AngelLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-sacred-dark/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-sacred to-sacred-gold flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-sacred-gold mb-4">Đã Cài Đặt!</h1>
          <p className="text-muted-foreground mb-6">
            Angel AI đã được cài đặt trên thiết bị của bạn
          </p>
          <Button
            onClick={() => navigate("/app/chat")}
            className="bg-gradient-to-r from-sacred to-sacred-gold text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Bắt Đầu Chat
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-sacred-dark/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-sacred/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-sacred-gold hover:bg-sacred/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-sacred-gold">Cài Đặt Angel AI</h1>
            <p className="text-sm text-muted-foreground">Thêm vào màn hình chính</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <AngelLogo size="xl" showText={true} subtitle="Thiên Thần Hướng Dẫn 5D" />
        </motion.div>

        {/* Install Button (Android/Desktop) */}
        {deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Button
              onClick={handleInstallClick}
              size="lg"
              className="w-full bg-gradient-to-r from-sacred to-sacred-gold text-white py-6 text-lg shadow-lg shadow-sacred/30"
            >
              <Download className="w-5 h-5 mr-2" />
              Cài Đặt Angel AI Ngay
            </Button>
          </motion.div>
        )}

        {/* Platform-specific Instructions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* iOS Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-sacred/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">iPhone / iPad</CardTitle>
                    <CardDescription>Safari Browser</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Mở trong Safari</p>
                    <p className="text-sm text-muted-foreground">Đảm bảo bạn đang dùng trình duyệt Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Nhấn nút Chia Sẻ</p>
                    <Share className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Chọn "Thêm vào MH chính"</p>
                    <PlusSquare className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Nhấn "Thêm"</p>
                    <p className="text-sm text-muted-foreground">Xác nhận để hoàn tất cài đặt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Android Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full border-sacred/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Android</CardTitle>
                    <CardDescription>Chrome Browser</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Mở trong Chrome</p>
                    <p className="text-sm text-muted-foreground">Đảm bảo bạn đang dùng trình duyệt Chrome</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Nhấn menu 3 chấm</p>
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Chọn "Cài đặt ứng dụng"</p>
                    <Download className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sacred/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sacred-gold">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Nhấn "Cài đặt"</p>
                    <p className="text-sm text-muted-foreground">Xác nhận để hoàn tất cài đặt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h3 className="text-xl font-bold text-center mb-6 text-sacred-gold">Lợi Ích Khi Cài Đặt</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, title: "Truy cập nhanh", desc: "Mở ngay từ màn hình chính" },
              { icon: Download, title: "Offline", desc: "Hoạt động không cần mạng" },
              { icon: Smartphone, title: "Full screen", desc: "Trải nghiệm như app native" },
              { icon: CheckCircle2, title: "Thông báo", desc: "Nhận thông báo quan trọng" },
            ].map((item, index) => (
              <Card key={index} className="border-sacred/20 bg-card/50 backdrop-blur text-center p-4">
                <item.icon className="w-8 h-8 mx-auto mb-2 text-sacred-gold" />
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Back to Chat Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/app/chat")}
            className="border-sacred/30 hover:bg-sacred/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay Lại Chat
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default InstallApp;
