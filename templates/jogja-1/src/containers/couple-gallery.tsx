import { motion, useInView } from 'motion/react';
import { Carousel, CarouselContent, CarouselItem } from '../components/ui/carousel';
import { useRef, useState } from 'react';
import { useInvitationStore } from '@temanten/sdk';
import { assetUrl } from '../lib/asset';

export const CoupleGallery = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { data: invitationData } = useInvitationStore();
  const { gallery } = invitationData;
  const [current, setCurrent] = useState(0);

  if (!gallery?.length) return null;

  return (
    <section
      id="gallery-section"
      className="min-h-screen relative flex flex-col justify-center items-center px-4"
    >
      <div ref={ref} className="container max-w-4xl">
        <motion.h1
          className="font-arashveti text-3xl font-bold text-center mb-8 text-[#a85200] dark:text-[#e8a060]"
          initial={{ y: -24, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Galeri Kami
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
              {gallery.map((url: string, index: number) => (
                <CarouselItem key={url} className="h-full">
                  <div
                    className="relative flex items-center justify-center rounded-2xl overflow-hidden h-[320px]
                      bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-gray-700/50
                      before:absolute before:inset-0 before:rounded-2xl
                      before:bg-gradient-to-br before:from-white/50 before:via-white/10 before:to-transparent
                      before:pointer-events-none"
                  >
                    <img
                      src={url}
                      alt={`Galeri foto ${index + 1}`}
                      className="relative w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex justify-center gap-2 mt-4">
            {gallery.map((_: string, index: number) => (
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 px-4">
            {gallery.map((url: string, index: number) => (
              <div
                key={url}
                className="relative rounded-xl overflow-hidden h-[140px]
                  bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-gray-700/50
                  before:absolute before:inset-0 before:rounded-xl
                  before:bg-gradient-to-br before:from-white/50 before:via-white/10 before:to-transparent
                  before:pointer-events-none"
              >
                <img
                  src={url}
                  alt={`Galeri foto ${index + 1}`}
                  className="relative w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
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
  );
};
