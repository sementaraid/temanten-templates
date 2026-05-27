import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { useTemantenSetter, useTemantenState } from '@temanten/sdk';
import { assetUrl } from '../lib/asset';

export const SplashScreen = () => {
  const { screenState, invitationData } = useTemantenState();
  const setUiState = useTemantenSetter();
  const { bride, groom } = invitationData;

  const show = screenState === 'welcome';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          className="absolute inset-0 z-[9999] flex items-center justify-center bg-[#f5f5dc] dark:bg-[#1a0e05]"
        >
          <div className="relative w-full h-full overflow-hidden px-6">
            <img
              src={assetUrl('/images/gunungan.png')}
              className="pointer-events-none w-full h-auto absolute -left-5 bottom-20 scale-300 opacity-[30%] invert-[0.5] blur-[4px]"
            />
            <motion.div
              id="welcome-screen"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.45 } }}
              exit={{ y: -24, opacity: 0, scale: 0.96, transition: { duration: 0.45 } }}
              className="flex justify-center items-center min-h-screen flex-col space-y-4"
            >
              <img src={assetUrl('/images/gunungan.png')} className="w-48 h-auto" />
              <div className="space-y-4">
                <h2 className="font-arashveti text-4xl font-bold text-[#a85200] dark:text-[#e8a060] text-center">
                  {bride.nickname}
                </h2>
                <h2 className="font-arashveti text-4xl font-bold text-[#a85200] dark:text-[#e8a060] text-center">
                  {groom.nickname}
                </h2>
              </div>
              <p className="text-center text-xs font-open-sans text-gray-700 dark:text-gray-300 px-4">
                {invitationData.message}
              </p>
              <Button
                size="sm"
                className="rounded-full w-[250px] bg-[#a85200] hover:bg-[#8a4500] text-white transition-colors text-xs font-open-sans font-semibold"
                onClick={() =>
                  setUiState((prev) => ({
                    ...prev,
                    playAudio: prev.screenState === 'welcome',
                    screenState: 'main',
                  }))
                }
              >
                Buka Undangan
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
