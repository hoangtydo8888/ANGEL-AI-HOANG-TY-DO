import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WelcomeAirdropPopup from '@/components/WelcomeAirdropPopup';
import Leaderboard from '@/components/app/Leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';
import FloatingParticles from '@/components/FloatingParticles';
import AppSidebar from '@/components/AppSidebar';
import GlobalSearch from '@/components/app/GlobalSearch';
import ChatSection from '@/components/app/ChatSection';
import CamlycoinHistory from '@/components/app/CamlycoinHistory';
import VoiceMode from '@/components/app/VoiceMode';
import ImagineSection from '@/components/app/ImagineSection';
import { KnowledgeBase } from '@/components/app/KnowledgeBase';
import { CamlyRewardsPanel } from '@/components/app/CamlyRewardsPanel';
import CommunityWisdom from '@/components/app/CommunityWisdom';
import MultiAIFusion from '@/components/app/MultiAIFusion';
import DivineHealing from '@/components/app/DivineHealing';
import ProfileSection from '@/components/app/ProfileSection';
import { cn } from '@/lib/utils';
import AngelLogo from '@/components/AngelLogo';

// Map URL section params to internal section names
const sectionParamMap: Record<string, string> = {
  community: 'community-wisdom',
  multiAI: 'multi-ai',
  healing: 'divine-healing',
};

const AppDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState('chat');

  // Read section from URL on mount
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      const mappedSection = sectionParamMap[sectionParam] || sectionParam;
      setCurrentSection(mappedSection);
      // Clear the URL param after reading
      searchParams.delete('section');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const renderSection = () => {
    switch (currentSection) {
      case 'search': return <GlobalSearch />;
      case 'chat': return <ChatSection />;
      case 'community-wisdom': return <CommunityWisdom />;
      case 'multi-ai': return <MultiAIFusion />;
      case 'divine-healing': return <DivineHealing />;
      case 'camly-rewards': return <CamlyRewardsPanel />;
      case 'camlycoin-history': return <CamlycoinHistory />;
      case 'voice': return <VoiceMode />;
      case 'imagine': return <ImagineSection />;
      case 'knowledge': return <KnowledgeBase />;
      case 'bounty': return <Leaderboard />;
      case 'profile': return <ProfileSection />;
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-semibold mb-2">Đang phát triển</h2>
              <p className="text-muted-foreground">Tính năng này sẽ sớm ra mắt</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster position="top-center" richColors />
      <FloatingParticles />

      <AppSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={setCurrentSection}
        currentSection={currentSection}
      />

      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        sidebarOpen ? "lg:ml-0" : "lg:ml-0"
      )}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-4 p-4 border-b border-border/30 bg-card/80 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-muted/50"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <AngelLogo size="sm" showText={false} />
            <h1 className="font-cinzel font-bold" style={{ color: 'hsl(51 100% 45%)' }}>ANGEL AI</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AppDashboard;
