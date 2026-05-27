import { motion, useInView } from 'motion/react';
import { Carousel, CarouselContent, CarouselItem } from '../components/ui/carousel';
import { useRef, useState } from 'react';
import { useTemantenState } from '@temanten/sdk';
import { assetUrl } from '../lib/asset';

const LoveStory = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { invitationData } = useTemantenState();
  const { loveStory } = invitationData;
  const [current, setCurrent] = useState(0);

  return (
    <>
      <section
        id="timeline-section"
        className="min-h-screen relative flex flex-col justify-center items-center px-4"
      >
        <div ref={ref} className="container max-w-4xl">
          <motion.h1
            className="font-arashveti text-3xl font-bold text-center mb-8 text-[#a85200] dark:text-[#e8a060]"
            initial={{ y: -24, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Kisah Kami
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Carousel
              opts={{ align: 'center', loop: false }}
              className="w-full px-4"
              setApi={(api) => {
                if (!api) return;
                api.on('select', () => setCurrent(api.selectedScrollSnap()));
              }}
            >
              <CarouselContent>
                {loveStory.map((entry, index) => (
                  <CarouselItem key={index} className="h-full">
                    <div
                      className="relative flex flex-col items-center justify-center text-center px-6 py-8 rounded-2xl overflow-hidden h-[260px]
                      bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-gray-700/50
                      before:absolute before:inset-0 before:rounded-2xl
                      before:bg-gradient-to-br before:from-white/50 before:via-white/10 before:to-transparent
                      before:pointer-events-none"
                    >
                      <span className="relative text-xs text-[#a85200] dark:text-[#e8a060] font-semibold mb-2 tracking-widest uppercase">
                        {entry.date}
                      </span>
                      <h4 className="relative font-serif text-lg text-gray-900 dark:text-gray-100 mb-3">
                        {entry.title}
                      </h4>
                      <p className="relative font-open-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm">
                        {entry.content}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
                <CarouselItem className="h-full">
                  <div
                    className="relative flex flex-col items-center justify-center text-center px-6 py-8 rounded-2xl overflow-hidden h-[260px]
                      bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-gray-700/50
                      before:absolute before:inset-0 before:rounded-2xl
                      before:bg-gradient-to-br before:from-white/50 before:via-white/10 before:to-transparent
                      before:pointer-events-none"
                  >
                    <h4 className="relative font-serif text-lg text-gray-900 dark:text-gray-100 mb-3">
                      Terimakasih Sudah Membaca Kisah Kami
                    </h4>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            <div className="flex justify-center gap-2 mt-4">
              {[...loveStory, null].map((_, index) => (
                <span
                  key={index}
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    index === current
                      ? 'w-5 bg-[#a85200] dark:bg-[#e8a060]'
                      : 'w-1.5 bg-[#a85200]/30 dark:bg-[#e8a060]/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={assetUrl('/images/awan.png')}
            alt="Awan Decoration"
            className="w-full h-auto absolute -top-24 transform -scale-y-100"
          />
          <img
            src={assetUrl('/images/awan.png')}
            alt="Awan Decoration"
            className="w-full h-auto absolute -bottom-24"
          />
        </div>
      </section>
    </>
  );
};

export { LoveStory };
