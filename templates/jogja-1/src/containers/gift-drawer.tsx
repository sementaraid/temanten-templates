import { motion, AnimatePresence } from 'motion/react';
import { DebitCard } from './debit-card';
import { CopyableText } from '../components/invitation/copyable-text';
import { useTemantenSetter, useTemantenState } from '@temanten/sdk';
import { useScrollLock } from '../hooks/useScrollLock';

const GiftDrawer = () => {
  const { drawerOpen, invitationData } = useTemantenState();
  const setUiState = useTemantenSetter();
  const { gift } = invitationData;
  const hasEwallet = Boolean(gift.ewalletProvider && gift.ewalletNumber);

  useScrollLock(drawerOpen);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          className="absolute h-full bottom-0 inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setUiState((prev) => ({ ...prev, drawerOpen: false }))}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="sticky bottom-0 z-50 w-full bg-white dark:bg-gray-900 rounded-t-[28px] p-4 space-y-4 max-w-screen-sm mb-0"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Bank transfer */}
            <div className="space-y-3">
              <DebitCard
                bankName={gift.bankName || 'BANK'}
                accountNumber={gift.accountNumber}
                accountName={gift.accountName}
              />
              <CopyableText
                text={gift.accountNumber}
                label={`${gift.bankName ? gift.bankName + ' · ' : ''}${gift.accountName}`}
              />
            </div>

            {/* E-wallet — only rendered when filled in */}
            {hasEwallet && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Dompet Digital
                </p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {gift.ewalletProvider.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {gift.ewalletProvider}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {gift.ewalletName || gift.accountName}
                    </p>
                  </div>
                </div>
                <CopyableText
                  text={gift.ewalletNumber}
                  label={`${gift.ewalletProvider} · ${gift.ewalletName || gift.accountName}`}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { GiftDrawer };
