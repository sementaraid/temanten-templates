import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTemantenState, useTemantenStore } from '@temanten/sdk';

export const QrCheckin = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { screenState } = useTemantenState();
  const { guest } = useTemantenStore();
  const isInView = useInView(ref, { once: true });

  const { guestId } = guest;

  if (!guestId) return null;

  const isActive = screenState === 'main' && isInView;

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: -16, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 1.8 } },
  };

  return (
    <section
      id="qr-checkin-section"
      className="relative overflow-x-hidden flex flex-col justify-center items-center px-4 py-12 overflow-hidden"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
        className="flex flex-col items-center gap-6 w-full"
      >
        <div className="space-y-2 text-center">
          <motion.h2
            variants={itemVariants}
            className="font-arashveti text-3xl font-bold text-[#a85200] dark:text-[#e8a060]"
          >
            Tiket Masuk
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xs text-gray-700 dark:text-gray-300 font-open-sans"
          >
            Tunjukkan QR ini saat check-in di lokasi acara
          </motion.p>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-4 bg-white dark:bg-gray-900 border-2 border-[#a85200]/20 rounded-2xl p-6 shadow-lg"
        >
          <div className="p-3 bg-white rounded-xl border border-[#a85200]/10">
            <QRCodeSVG
              value={guestId}
              size={180}
              level="M"
              includeMargin={false}
              fgColor="#7c3d00"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono break-all text-center max-w-[200px]">
            {guestId}
          </p>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-xs text-gray-500 dark:text-gray-400 font-open-sans text-center"
        >
          Petugas kami akan memindai QR ini untuk konfirmasi kehadiran Anda
        </motion.p>
      </motion.div>
    </section>
  );
};
