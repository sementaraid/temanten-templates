import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { motion, useInView } from 'motion/react';
import { useTemantenState } from '@temanten/sdk';
import { useRef } from 'react';
import { assetUrl } from '../lib/asset';

export const CeremonyAfter = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { screenState, invitationData } = useTemantenState();
  const isInView = useInView(ref, { once: true });
  const { reception } = invitationData;

  const isActive = screenState === 'main';
  const shouldAnimate = isActive && isInView;

  const dateDisplay = new Date(`${reception.date}T00:00:00`)
    .toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.18, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: -24, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 0.6 } },
    exit: { y: -12, opacity: 0, transition: { duration: 0.35 } },
  };

  return (
    <section
      id="ceremony-after-section"
      className="min-h-screen relative overflow-x-hidden flex flex-col justify-center items-center px-4 overflow-hidden"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={shouldAnimate ? 'enter' : 'hidden'}
        className="mb-2 mt-4"
      >
        <div className="space-y-8 text-center">
          <motion.img
            src={assetUrl('/images/gunungan.png')}
            className="w-20 h-auto m-auto"
            alt=""
            variants={itemVariants}
          />
          <motion.h2
            variants={itemVariants}
            className="font-arashveti text-3xl font-bold text-[#a85200] dark:text-[#e8a060]"
          >
            Resepsi
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs my-6 text-gray-700 dark:text-gray-300"
          >
            Akan dilaksanakan pada :
          </motion.p>
        </div>

        <div className="text-center mt-8 px-4 space-y-2">
          <motion.h3 variants={itemVariants} className="font-serif text-2xl">
            {dateDisplay}
          </motion.h3>
          <motion.h3 variants={itemVariants} className="font-serif text-2xl">
            {reception.time} WIB
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs my-6 text-gray-700 dark:text-gray-300"
          >
            {reception.locationName}
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs my-6 text-gray-700 dark:text-gray-300 font-semibold leading-relaxed"
          >
            {reception.address}
          </motion.p>
          <motion.div variants={itemVariants} className="space-y-1">
            <a
              href={reception.mapsUrl}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'default' }),
                'rounded-full w-[250px] bg-[#a85200] hover:bg-[#8a4500] text-white transition-colors text-xs'
              )}
              target="_blank"
              rel="noreferrer"
            >
              Buka peta
            </a>
          </motion.div>
        </div>
      </motion.div>

      <img
        src={assetUrl('/images/gunungan.png')}
        className="pointer-events-none w-full h-auto absolute -left-58 bottom-20 scale-300 opacity-[15%] invert-[0.5] blur-[3px]"
      />
      <img
        src={assetUrl('/images/rama.png')}
        alt="Rama"
        className="pointer-events-none h-auto w-full absolute -bottom-2 -right-40 select-none opacity-10 transform scale-x-120 scale-y-120"
        aria-hidden="true"
      />
      <img
        src={assetUrl('/images/awan.png')}
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute -top-24 transform -scale-y-100"
      />
      <img
        src={assetUrl('/images/awan.png')}
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute -bottom-24"
      />
    </section>
  );
};
