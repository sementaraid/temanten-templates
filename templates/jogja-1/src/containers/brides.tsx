import { motion } from 'motion/react';
import { useTemantenState } from '@temanten/sdk';
import { assetUrl } from '../lib/asset';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const Brides = () => {
  const [ref, isInView] = useScrollReveal<HTMLDivElement>();
  const { screenState, invitationData } = useTemantenState();
  const { bride, groom } = invitationData;

  const isActive = screenState === 'main';
  const shouldAnimate = isActive && isInView;

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.36, delayChildren: 0.18 } },
  };

  const itemVariants = {
    hidden: { y: -12, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 2 } },
    exit: { y: -8, opacity: 0, transition: { duration: 2 } },
  };

  return (
    <section
      id="brides-section"
      className="min-h-screen relative overflow-x-hidden flex flex-col justify-center items-center px-4 overflow-hidden"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={shouldAnimate ? 'enter' : 'hidden'}
        className="mb-2 mt-16 w-full"
      >
        <div className="space-y-8 text-center">
          <motion.h2
            variants={itemVariants}
            className="font-arashveti text-3xl font-bold text-[#a85200] dark:text-[#e8a060]"
          >
            Kami yang berbahagia
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            Berbekal niat suci dan atas izin Allah SWT, dengan kerendahan hati, kami mengharapkan
            kehadiran Bapak/Ibu/Saudara/i pada acara pernikahan kami :
          </motion.p>
        </div>

        <div className="text-center mt-8 px-4 space-y-2">
          <motion.h3 variants={itemVariants} className="font-serif text-2xl">
            {bride.fullName}
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs text-gray-700 dark:text-gray-300"
          >
            {bride.birthOrder}
            <br />
            <strong>
              {`${bride.father}`} & {`${bride.mother}`}
            </strong>
          </motion.p>
          {bride.instagram && (
            <motion.a
              variants={itemVariants}
              href={bride.instagram}
              target="_blank"
              rel="noreferrer"
              className="font-open-sans text-xs text-[#a85200] dark:text-[#e8a060] inline-flex items-center gap-1 hover:underline"
            >
              {bride.instagram
                .replace(/https?:\/\/(www\.)?instagram\.com\//, '@')
                .replace(/\/$/, '')}
            </motion.a>
          )}
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs text-gray-700 dark:text-gray-300 my-6"
          >
            dengan
          </motion.p>
          <motion.h3 variants={itemVariants} className="font-serif text-2xl mt-4">
            {groom.fullName}
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs text-gray-700 dark:text-gray-300"
          >
            {groom.birthOrder}
            <br />
            <strong>
              {`${groom.father}`} & {`${groom.mother}`}
            </strong>
          </motion.p>
          {groom.instagram && (
            <motion.a
              variants={itemVariants}
              href={groom.instagram}
              target="_blank"
              rel="noreferrer"
              className="font-open-sans text-xs text-[#a85200] dark:text-[#e8a060] inline-flex items-center gap-1 hover:underline"
            >
              {groom.instagram
                .replace(/https?:\/\/(www\.)?instagram\.com\//, '@')
                .replace(/\/$/, '')}
            </motion.a>
          )}
        </div>
      </motion.div>

      <img
        src={assetUrl('/images/sinta.png')}
        alt="Sinta"
        className="pointer-events-none w-full h-auto absolute -bottom-4 -left-50 select-none opacity-20 blur transform -rotate-[20deg] -scale-x-100"
        aria-hidden="true"
      />
      <img
        src={assetUrl('/images/rama.png')}
        alt="Rama"
        className="pointer-events-none w-full h-auto absolute -bottom-4 -right-30 select-none opacity-20 blur"
        aria-hidden="true"
      />
      <img
        src={assetUrl('/images/awan.png')}
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute -top-2 transform -scale-y-100"
      />
      <img
        src={assetUrl('/images/awan.png')}
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute -bottom-24"
      />
    </section>
  );
};
