import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { useTemantenState, useTemantenStore } from '@temanten/sdk';
import type { Attendance } from '@temanten/sdk';
import { assetUrl } from '../lib/asset';

export function Comments() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { screenState } = useTemantenState();
  const { guest } = useTemantenStore();
  const isInView = useInView(ref, { once: true });

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState<Attendance | null>(null);

  const isActive = screenState === 'main' && isInView;
  const { guestId, comments, commentsLoading, submitting, submitted, submit } = guest;

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return;
    if (guestId && !attendance) return;
    await submit(name, message, attendance);
    setName('');
    setMessage('');
    setAttendance(null);
  };

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.18, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: -24, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 2 } },
  };

  return (
    <section
      id="comments-section"
      className="min-h-screen relative overflow-x-hidden flex flex-col justify-center items-center px-4 overflow-hidden"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        className="w-full"
        animate={isActive ? 'enter' : 'hidden'}
      >
        <div className="space-y-4 text-center mb-4">
          <motion.h2
            variants={itemVariants}
            className="font-arashveti text-3xl font-bold text-[#a85200] dark:text-[#e8a060]"
          >
            Doa dan Ucapan
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xs text-gray-700 dark:text-gray-300 font-open-sans"
          >
            Berikan doa dan ucapan terbaik untuk kedua mempelai
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="mb-4">
          <Card className="border-[#a85200]/20 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm w-full">
            <CardContent className="pt-0">
              {submitted ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#a85200] dark:text-[#e8a060]">
                    Terima kasih! 🙏
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-open-sans">
                    Konfirmasi kehadiran dan ucapan Anda telah kami terima.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guestId && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 font-open-sans">
                        Konfirmasi Kehadiran
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAttendance('attending')}
                          className={cn(
                            'rounded-full flex-1 py-2 text-xs font-semibold border transition-colors',
                            attendance === 'attending'
                              ? 'bg-[#a85200] text-white border-[#a85200]'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#a85200]/40'
                          )}
                        >
                          Hadir
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendance('tentative')}
                          className={cn(
                            'rounded-full flex-1 py-2 text-xs font-semibold border transition-colors',
                            attendance === 'tentative'
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-sky-400'
                          )}
                        >
                          Diusahakan
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendance('not_attending')}
                          className={cn(
                            'rounded-full flex-1 py-2 text-xs font-semibold border transition-colors',
                            attendance === 'not_attending'
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                          )}
                        >
                          Tidak Hadir
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 font-open-sans"
                    >
                      Nama
                    </label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-[#a85200]/30 focus:border-[#a85200] focus:ring-[#a85200] text-xs font-open-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Ucapan
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tulis doa dan ucapan Anda di sini..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border-[#a85200]/30 focus:border-[#a85200] focus:ring-[#a85200] min-h-[80px] resize-none text-xs font-open-sans"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitting || !name.trim() || !message.trim() || (!!guestId && !attendance)
                    }
                    size={'sm'}
                    className="rounded-full w-full bg-[#a85200] hover:bg-[#8a4500] text-white transition-colors text-xs disabled:opacity-50"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Ucapan'}
                  </Button>
                </div>
              )}

              {commentsLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#a85200]/40 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#a85200]/8 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-6 h-6 text-[#a85200]/50 dark:text-[#e8a060]/50"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 font-open-sans">
                      Belum ada ucapan
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-open-sans">
                      Jadilah yang pertama memberikan doa dan ucapan
                    </p>
                  </div>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="enter"
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'px-0 py-4',
                      index !== comments.length - 1 && 'border-b border-dashed border-[#a85200]/30',
                      index === comments.length - 1 && 'pb-0'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#a85200] dark:text-[#e8a060] text-base">
                        {comment.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-open-sans">
                        {comment.timestamp.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-open-sans">
                      {comment.message}
                    </p>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <img
        src={assetUrl('/images/awan.png')}
        alt=""
        className="pointer-events-none w-full h-auto absolute -top-24 -scale-y-100"
        aria-hidden="true"
      />
    </section>
  );
}
