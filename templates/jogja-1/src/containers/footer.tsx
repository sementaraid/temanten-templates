import { motion, useInView } from 'motion/react';
import { useTemantenState } from '@temanten/sdk';
import { useRef } from 'react';
import { GithubIcon } from 'lucide-react';
import { assetUrl } from '../lib/asset';

export const Footer = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { screenState } = useTemantenState();
  const isInView = useInView(ref, { once: true });
  const isActive = screenState === 'main' && isInView;

  const itemVariants = {
    hidden: { y: -12, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 2 } },
    exit: { y: -8, opacity: 0, transition: { duration: 2 } },
  };

  const sintaVariants = {
    hidden: { x: -200, opacity: 0, scaleX: -1, rotate: 0 },
    enter: {
      x: 0,
      opacity: 1,
      scaleX: -1,
      rotate: 0,
      transition: { duration: 4.0 },
    },
  };

  const ramaVariants = {
    hidden: { x: 200, opacity: 0, rotate: -10 },
    enter: { x: 0, opacity: 1, rotate: -20, transition: { duration: 4.0 } },
  };

  return (
    <section
      id="footer-section"
      className="min-h-[55vh] relative oveflow-x-hidden block px-4 overflow-hidden"
      ref={ref}
    >
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
        className="flex flex-col justify-center items-center text-center gap-2"
      >
        <img src={assetUrl('/images/gunungan.png')} className="h-16 w-16" />
        <p className="flex gap-1 items-center text-sm font-open-sans text-gray-700 dark:text-gray-300">
          Special moments created with<strong>love</strong>
        </p>
        <p className="flex gap-1 items-center text-sm font-open-sans text-gray-700 dark:text-gray-300">
          From <strong>Jogja</strong>
        </p>
        <span className="flex items-center gap-2">
          <a href="#" target="_blank">
            <GithubIcon />
          </a>
        </span>
      </motion.div>
      <motion.img
        src={assetUrl('/images/sinta.png')}
        alt="Sinta"
        className="pointer-events-none w-2/4 h-auto filter absolute bottom-10 left-4"
        variants={sintaVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
      />

      {/* Rama: slide in from right and rotate into place */}
      <motion.img
        src={assetUrl('/images/rama.png')}
        alt="Rama"
        className="pointer-events-none w-2/4 h-auto absolute bottom-10 right-8"
        variants={ramaVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
      />

      <img
        src={assetUrl('/images/awan.png')}
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute bottom-0 left-0"
      />
    </section>
  );
};
