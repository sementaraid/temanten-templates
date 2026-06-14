import { motion } from 'motion/react';
import { useTemantenState } from '@temanten/sdk';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const CoupleGallery = () => {
  const [ref, isInView] = useScrollReveal<HTMLDivElement>();
  const { screenState, invitationData } = useTemantenState();
  const { gallery } = invitationData;

  if (!gallery?.length) return null;

  const isActive = screenState === 'main';
  const shouldAnimate = isActive && isInView;

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    enter: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  };

  const headingVariants = {
    hidden: { y: -10, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 1.2 } },
  };

  return (
    <section
      id="gallery-section"
      className="relative overflow-hidden py-12 px-4"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={shouldAnimate ? 'enter' : 'hidden'}
      >
        <motion.h2
          variants={headingVariants}
          className="font-arashveti text-2xl font-bold text-center text-[#a85200] dark:text-[#e8a060] mb-8"
        >
          Momen Kami
        </motion.h2>

        <div className="grid grid-cols-2 gap-2">
          {gallery.map((url, index) => (
            <motion.div
              key={url}
              variants={itemVariants}
              className={`overflow-hidden rounded-xl ${
                index === 0 && gallery.length >= 3 ? 'col-span-2 aspect-video' : 'aspect-square'
              }`}
            >
              <img
                src={url}
                alt={`Momen pernikahan ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
