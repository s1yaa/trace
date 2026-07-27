'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout';

type AppState = 'onboarding' | 'workspace';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('onboarding');

  const handleEnterWorkspace = () => {
    setAppState('workspace');
  };

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      <AnimatePresence mode="wait">
        {appState === 'onboarding' ? (
          <OnboardingScreen key="onboarding" onEnter={handleEnterWorkspace} />
        ) : (
          <motion.div
            key="workspace"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <WorkspaceLayout />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
