import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { useUIStore, useInvitationStore } from '@temanten/sdk';
import { DebitCard } from './debit-card';
import { CopyableText } from '../components/invitation/copyable-text';

export const Gift = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { screenState } = useUIStore();
  const { data: invitationData } = useInvitationStore();
  const isInView = useInView(ref, { once: true });
  const { gift } = invitationData;
  const hasEwallet = Boolean(gift.ewalletProvider && gift.ewalletNumber);

  const isActive = screenState === 'main' && isInView;

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.18, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: -24, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  return (
    <section
      id="gift-section"
      className="min-h-screen relative overflow-x-hidden flex flex-col justify-center items-center px-4 overflow-hidden py-20"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
        className="w-full space-y-6"
      >
        <div className="text-center space-y-3">
          <motion.img
            src="/images/gunungan.png"
            className="w-16 h-auto m-auto"
            alt=""
            variants={itemVariants}
          />
          <motion.h2
            variants={itemVariants}
            className="font-arashveti text-3xl font-bold text-[#a85200] dark:text-[#e8a060]"
          >
            Amplop Digital
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-open-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Jika ingin memberikan
            hadiah, silakan gunakan salah satu metode berikut.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="space-y-3">
          <DebitCard
            bankName={gift.bankName || 'BANK'}
            accountNumber={gift.accountNumber}
            accountName={gift.accountName}
            className="w-full"
          />
          <CopyableText
            text={gift.accountNumber}
            label={`${gift.bankName ? gift.bankName + ' · ' : ''}${gift.accountName}`}
          />
        </motion.div>

        {hasEwallet && (
          <motion.div
            variants={itemVariants}
            className="space-y-3 pt-4 border-t border-[#a85200]/20"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-open-sans">
              Dompet Digital
            </p>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {gift.ewalletProvider.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{gift.ewalletProvider}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {gift.ewalletName || gift.accountName}
                </p>
              </div>
            </div>
            <CopyableText
              text={gift.ewalletNumber}
              label={`${gift.ewalletProvider} · ${gift.ewalletName || gift.accountName}`}
            />
          </motion.div>
        )}
      </motion.div>

      <img
        src="/images/awan.png"
        alt=""
        className="pointer-events-none w-full h-auto absolute -top-24 transform -scale-y-100"
        aria-hidden="true"
      />
      <img
        src="/images/awan.png"
        alt=""
        className="pointer-events-none w-full h-auto absolute -bottom-24"
        aria-hidden="true"
      />
    </section>
  );
};
