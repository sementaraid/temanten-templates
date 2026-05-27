import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { useTemantenState } from '@temanten/sdk';
import { Button } from '../components/ui/button';
import { Countdown } from '../components/invitation/countdown';

export const Invitation = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { screenState, invitationData } = useTemantenState();
  const isInView = useInView(ref, { once: true });
  const isActive = screenState === 'main' && isInView;

  const { bride, groom, ceremony } = invitationData;

  const ceremonyDate = new Date(`${ceremony.date}T${ceremony.time}:00`);

  const handleAddToCalendar = () => {
    const end = new Date(ceremonyDate.getTime() + 4 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      'T' +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0') +
      '00';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Temanten.id//EN',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(ceremonyDate)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Pernikahan ${bride.nickname} & ${groom.nickname}`,
      `LOCATION:${ceremony.locationName}\\, ${ceremony.address}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'undangan.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dateDisplay = ceremonyDate
    .toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  const containerVariants = {
    hidden: {},
    enter: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: -12, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 2 } },
    exit: { y: -8, opacity: 0, transition: { duration: 2 } },
  };

  const sintaVariants = {
    hidden: { x: -200, opacity: 0, scaleX: -1, rotate: 0 },
    enter: { x: 0, opacity: 1, scaleX: -1, rotate: 0, transition: { duration: 4.0 } },
  };

  const ramaVariants = {
    hidden: { x: 200, opacity: 0, rotate: -10 },
    enter: { x: 0, opacity: 1, rotate: -20, transition: { duration: 4.0 } },
  };

  return (
    <section
      id="invitation-section"
      className="min-h-screen relative oveflow-x-hidden flex flex-col justify-center items-center px-4 overflow-hidden"
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
        className="space-y-4 text-center"
      >
        <motion.h2
          variants={itemVariants}
          className="font-arashveti text-5xl font-bold text-[#a85200] dark:text-[#e8a060]"
        >
          {bride.nickname}
        </motion.h2>
        <motion.h2
          variants={itemVariants}
          className="font-arashveti text-5xl font-bold text-[#a85200] dark:text-[#e8a060]"
        >
          {groom.nickname}
        </motion.h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
        className="text-center mt-8 mb-48 px-4 space-y-4"
      >
        <motion.p
          variants={itemVariants}
          className="font-open-sans text-gray-700 dark:text-gray-300 text-xs"
        >
          Kami mengundang Anda ke pernikahan kami
        </motion.p>
        <motion.h3 variants={itemVariants} className="font-serif text-xl">
          {dateDisplay}
        </motion.h3>

        <motion.div variants={itemVariants}>
          <Countdown targetDate={ceremonyDate}>
            {({ days, hours, minutes, seconds }) => (
              <div className="flex space-x-4 text-center justify-center">
                <div>
                  <div className="text-3xl font-bold">{days}</div>
                  <div className="text-sm font-open-sans font-semibold dark:text-gray-300">
                    Hari
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{hours}</div>
                  <div className="text-sm font-open-sans font-semibold dark:text-gray-300">Jam</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{minutes}</div>
                  <div className="text-sm font-open-sans font-semibold dark:text-gray-300">
                    Menit
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{seconds}</div>
                  <div className="text-sm font-open-sans font-semibold dark:text-gray-300">
                    Detik
                  </div>
                </div>
              </div>
            )}
          </Countdown>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            size="sm"
            onClick={handleAddToCalendar}
            className="rounded-full w-[250px] bg-[#a85200] hover:bg-[#8a4500] text-white transition-colors text-xs"
          >
            Simpan di kalendar
          </Button>
        </motion.div>
      </motion.div>

      <motion.img
        src="/images/sinta.png"
        alt="Sinta"
        className="pointer-events-none w-2/4 h-auto filter absolute bottom-10 left-4"
        variants={sintaVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
      />
      <motion.img
        src="/images/rama.png"
        alt="Rama"
        className="pointer-events-none w-2/4 h-auto absolute bottom-10 right-8"
        variants={ramaVariants}
        initial="hidden"
        animate={isActive ? 'enter' : 'hidden'}
      />
      <img
        src="/images/awan.png"
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute -top-12 transform -scale-y-100"
      />
      <img
        src="/images/awan.png"
        alt="Awan Decoration"
        className="pointer-events-none w-full h-auto absolute bottom-0"
      />
    </section>
  );
};
