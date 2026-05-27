import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { useUIStore } from '@temanten/sdk';

export const FloatingControls = () => {
  const { screenState, playAudio, darkMode, setPlayAudio, setDarkMode } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCollapse = useCallback(() => {
    if (collapseRef.current) clearTimeout(collapseRef.current);
    collapseRef.current = setTimeout(() => setIsExpanded(false), 2800);
  }, []);

  const handleAction = (fn: () => void) => {
    fn();
    scheduleCollapse();
  };

  return (
    <AnimatePresence>
      {screenState === 'main' && (
        <motion.div
          className="fixed top-5 right-5 z-40 pointer-events-none"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            layout
            className="pointer-events-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-xl overflow-hidden"
            style={{ borderRadius: 999 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isExpanded ? (
                <motion.button
                  key="collapsed"
                  onClick={() => {
                    setIsExpanded(true);
                    scheduleCollapse();
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  whileTap={{ scale: 0.93 }}
                  aria-label="Buka kontrol"
                >
                  {playAudio ? (
                    <Volume2 className="w-4 h-4 text-[#a85200] dark:text-[#e8a060]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="expanded"
                  className="flex items-center gap-0.5 px-1.5 py-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => handleAction(() => setPlayAudio(!playAudio))}
                    className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#a85200]/10 dark:hover:bg-[#a85200]/20 transition-colors"
                    whileTap={{ scale: 0.88 }}
                    aria-label={playAudio ? 'Senyapkan musik' : 'Nyalakan musik'}
                  >
                    {playAudio ? (
                      <Volume2 className="w-4 h-4 text-[#a85200] dark:text-[#e8a060]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleAction(() => setDarkMode(!darkMode))}
                    className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#a85200]/10 dark:hover:bg-[#a85200]/20 transition-colors"
                    whileTap={{ scale: 0.88 }}
                    aria-label={darkMode ? 'Mode terang' : 'Mode gelap'}
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
