import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Heart, BookOpen, Scroll, MessageCircle, Gift } from 'lucide-react';
import { useUIStore } from '@temanten/sdk';

const NAV_ITEMS = [
  { id: 'invitation-section', Icon: Home, label: 'Undangan' },
  { id: 'brides-section', Icon: Heart, label: 'Mempelai' },
  { id: 'ceremony-section', Icon: BookOpen, label: 'Akad' },
  { id: 'timeline-section', Icon: Scroll, label: 'Kisah' },
  { id: 'gift-section', Icon: Gift, label: 'Hadiah' },
  { id: 'comments-section', Icon: MessageCircle, label: 'Ucapan' },
] as const;

export const Navigation = () => {
  const { screenState } = useUIStore();
  const [activeId, setActiveId] = useState<string>(NAV_ITEMS[0].id);
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ratios = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    const updateActive = () => {
      let best = '';
      let max = 0;
      ratios.forEach((r, id) => {
        if (r > max) {
          max = r;
          best = id;
        }
      });
      if (best) setActiveId(best);
    };

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          ratios.set(id, entry.intersectionRatio);
          updateActive();
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scheduleCollapse = useCallback(() => {
    if (collapseRef.current) clearTimeout(collapseRef.current);
    collapseRef.current = setTimeout(() => setIsExpanded(false), 2800);
  }, []);

  const handlePillClick = () => {
    setIsExpanded(true);
    scheduleCollapse();
  };

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (collapseRef.current) clearTimeout(collapseRef.current);
    setIsExpanded(false);
  };

  const activeItem = NAV_ITEMS.find((i) => i.id === activeId) ?? NAV_ITEMS[0];
  const { Icon: ActiveIcon } = activeItem;

  return (
    <AnimatePresence>
      {screenState === 'main' && (
        <motion.div
          className="fixed bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
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
                  onClick={handlePillClick}
                  className="flex items-center gap-2 px-5 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-[#a85200] dark:bg-[#e8a060] flex-shrink-0"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <ActiveIcon className="w-4 h-4 text-[#a85200] dark:text-[#e8a060] flex-shrink-0" />
                  <span className="text-xs font-open-sans font-semibold text-[#a85200] dark:text-[#e8a060] whitespace-nowrap">
                    {activeItem.label}
                  </span>
                  <div className="flex items-center gap-[3px] ml-1">
                    {NAV_ITEMS.map((item) => (
                      <motion.span
                        key={item.id}
                        className="rounded-full bg-[#a85200] dark:bg-[#e8a060] flex-shrink-0"
                        animate={{
                          width: item.id === activeId ? 14 : 5,
                          height: 5,
                          opacity: item.id === activeId ? 1 : 0.3,
                        }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        style={{ display: 'block' }}
                      />
                    ))}
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="expanded"
                  className="flex items-center px-2 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {NAV_ITEMS.map(({ id, Icon }) => {
                    const isActive = id === activeId;
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        onClick={() => handleNavClick(id)}
                        className={`flex flex-col items-center justify-center gap-1 w-12 h-12 flex-shrink-0 rounded-full transition-colors duration-200 ${
                          isActive
                            ? 'bg-[#a85200] dark:bg-[#a85200]'
                            : 'hover:bg-[#a85200]/10 dark:hover:bg-[#a85200]/20'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-[#a85200] dark:text-[#e8a060]'
                          }`}
                        />
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
