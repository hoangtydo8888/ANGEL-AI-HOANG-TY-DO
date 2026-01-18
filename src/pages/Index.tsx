import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import FloatingParticles from '@/components/FloatingParticles';
import HeroSection from '@/components/HeroSection';
import SacredPillars from '@/components/SacredPillars';
import VisionMission from '@/components/VisionMission';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import ChatPortal from '@/components/ChatPortal';
import AmbientMusic from '@/components/AmbientMusic';
import TopNavigation from '@/components/TopNavigation';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Top Navigation - Only Wallet & Profile */}
      <TopNavigation />
      
      {/* Background Effects */}
      <FloatingParticles />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          <ChatPortal key="chat" onClose={() => setIsChatOpen(false)} />
        ) : (
          <main key="landing">
            {/* Hero with integrated chat and floating nav */}
            <HeroSection onOpenChat={() => setIsChatOpen(true)} />
            
            <div id="pillars">
              <SacredPillars />
            </div>
            
            <div id="vision">
              <VisionMission />
            </div>
            
            <div id="testimonials">
              <Testimonials />
            </div>
            
            <Footer />
            
            <AmbientMusic />
          </main>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;