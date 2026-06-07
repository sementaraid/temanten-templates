import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTemantenState, useTemantenStore } from '@temanten/sdk';

/* -------------------------------------------------------------------------- */
/*                            Time window helpers                              */
/* -------------------------------------------------------------------------- */

function parseEventTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setHours(h, m, 0, 0);
  return d;
}

function isWithinEventWindow(
  ceremony: { date: string; time: string },
  reception: { date: string; time: string }
): boolean {
  const now = new Date();
  const cStart = parseEventTime(ceremony.date, ceremony.time);
  const rStart = parseEventTime(reception.date, reception.time);
  const windowStart = cStart ?? rStart;
  if (!windowStart) return false;
  let windowEnd: Date;
  if (rStart) {
    windowEnd = new Date(rStart.getTime() + 4 * 3_600_000);
  } else if (cStart) {
    windowEnd = new Date(cStart.getTime() + 6 * 3_600_000);
  } else {
    return false;
  }
  return now >= windowStart && now <= windowEnd;
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

type PhotoEntry = {
  localId: string;
  localUrl: string;
  status: 'uploading' | 'done' | 'error';
};

const MAX_PHOTOS = 10;

/* -------------------------------------------------------------------------- */
/*                            GuestPhotoMoment                                 */
/* -------------------------------------------------------------------------- */

export const GuestPhotoMoment = () => {
  const { invitationData, screenState } = useTemantenState();
  const { guest } = useTemantenStore();
  const { guestId } = guest;
  const { id: invitationId, ceremony, reception } = invitationData;

  const [active, setActive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const check = () => setActive(isWithinEventWindow(ceremony, reception));
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [ceremony, reception]);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      photos.forEach((p) => URL.revokeObjectURL(p.localUrl));
    };
  }, []);

  // Camera stream lifecycle — restarts when facing mode flips
  useEffect(() => {
    if (!cameraOpen) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
      return;
    }

    setCameraReady(false);
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setCameraOpen(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, facingMode]);

  // Ensure stream is killed on unmount
  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const capturedCount = photos.length;
  const doneCount = photos.filter((p) => p.status === 'done').length;
  const canCapture = capturedCount < MAX_PHOTOS && !capturing;

  const uploadBlob = useCallback(
    async (blob: Blob, localId: string) => {
      if (!invitationId) return;
      try {
        const fd = new FormData();
        fd.append('photo', blob, 'photo.jpg');
        if (guestId) fd.append('guestId', guestId);

        const res = await fetch(`/api/photos/${invitationId}/upload`, {
          method: 'POST',
          body: fd,
        });

        if (!res.ok) throw new Error(res.status === 429 ? 'limit' : 'upload');
        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, status: 'done' } : p))
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, status: 'error' } : p))
        );
      }
    },
    [invitationId, guestId]
  );

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || !canCapture) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    setCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (!blob) return;
        const localUrl = URL.createObjectURL(blob);
        setPhotos((prev) => [{ localId, localUrl, status: 'uploading' }, ...prev]);
        uploadBlob(blob, localId);
      },
      'image/jpeg',
      0.85
    );

    // Auto-close after last shot
    if (capturedCount + 1 >= MAX_PHOTOS) {
      setTimeout(() => setCameraOpen(false), 500);
    }
  }, [cameraReady, canCapture, capturedCount, uploadBlob]);

  const lastPhoto = photos[0];

  if (!active || screenState !== 'main' || !guestId || !invitationId) return null;

  return (
    <>
      {/* ── Floating camera button ─────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
        onClick={() => (canCapture ? setCameraOpen(true) : setGalleryOpen(true))}
        className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-[#a85200] shadow-lg shadow-[#a85200]/40 flex items-center justify-center text-white"
        whileTap={{ scale: 0.88 }}
        aria-label="Abadikan momen"
      >
        <Camera className="w-6 h-6" />
        {doneCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#a85200] text-[10px] font-bold flex items-center justify-center border border-[#a85200]/20 pointer-events-none">
            {doneCount}
          </span>
        )}
      </motion.button>

      {/* ── Full-screen camera viewfinder ──────────────────────────────────── */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col"
          >
            {/* Flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key="flash"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-30 bg-white pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Camera loading state */}
            <AnimatePresence>
              {!cameraReady && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black"
                >
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Top bar */}
            <div className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4">
              <button
                type="button"
                onClick={() => setCameraOpen(false)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label="Tutup kamera"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-semibold font-open-sans">
                {capturedCount}/{MAX_PHOTOS}
              </div>

              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label="Ganti kamera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="relative z-20 mt-auto flex items-center justify-between px-8 pb-14 pt-6">
              {/* Last captured thumbnail — tap to view gallery */}
              <button
                type="button"
                onClick={() => {
                  setCameraOpen(false);
                  setGalleryOpen(true);
                }}
                className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 border-2 border-white/30 flex-shrink-0"
                aria-label="Lihat galeri"
              >
                {lastPhoto ? (
                  <img
                    src={lastPhoto.localUrl}
                    alt="Foto terakhir"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </button>

              {/* Shutter */}
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady || !canCapture}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                aria-label="Ambil foto"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>

              {/* Spacer */}
              <div className="w-14 h-14 flex-shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gallery bottom drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {galleryOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setGalleryOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[#faf7f2] dark:bg-[#1a0e05] max-h-[85dvh] flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#a85200]/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div>
                  <h3 className="font-arashveti text-xl font-bold text-[#a85200] dark:text-[#e8a060]">
                    Foto Momenmu
                  </h3>
                  <p className="font-open-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {doneCount}/{MAX_PHOTOS} foto diunggah
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#a85200]/10 flex items-center justify-center text-[#a85200] dark:text-[#e8a060] hover:bg-[#a85200]/20 transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto px-5 pb-8 flex-1">
                {/* Take more photos */}
                {canCapture && (
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryOpen(false);
                      setCameraOpen(true);
                    }}
                    className="w-full flex flex-col items-center gap-3 py-8 border-2 border-dashed border-[#a85200]/30 rounded-2xl bg-[#a85200]/5 hover:bg-[#a85200]/10 active:bg-[#a85200]/15 transition-colors mb-5"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#a85200]/15 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-[#a85200] dark:text-[#e8a060]" />
                    </div>
                    <div className="text-center">
                      <p className="font-open-sans text-sm font-semibold text-[#a85200] dark:text-[#e8a060]">
                        Ambil Foto
                      </p>
                      <p className="font-open-sans text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Sisa {MAX_PHOTOS - capturedCount} foto
                      </p>
                    </div>
                  </button>
                )}

                {/* Upload in progress */}
                {photos.some((p) => p.status === 'uploading') && (
                  <div className="flex items-center gap-2 text-xs text-[#a85200] bg-[#a85200]/8 dark:bg-[#a85200]/15 rounded-xl px-4 py-3 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="font-open-sans">Mengunggah foto…</span>
                  </div>
                )}

                {/* All done */}
                {doneCount >= MAX_PHOTOS && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 mb-4">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-open-sans">
                      Semua {MAX_PHOTOS} foto sudah diunggah. Terima kasih!
                    </span>
                  </div>
                )}

                {/* Photo grid */}
                {photos.length > 0 && (
                  <div>
                    <p className="font-open-sans text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                      Foto Kamu
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((p) => (
                        <div
                          key={p.localId}
                          className="aspect-square rounded-xl overflow-hidden bg-[#a85200]/10 relative"
                        >
                          <img
                            src={p.localUrl}
                            alt="Momen pernikahan"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {p.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                          {p.status === 'error' && (
                            <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1 px-2">
                              <AlertCircle className="w-5 h-5 text-white" />
                              <span className="font-open-sans text-[9px] text-white text-center leading-tight">
                                Gagal
                              </span>
                            </div>
                          )}
                          {p.status === 'done' && (
                            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {photos.length === 0 && (
                  <p className="font-open-sans text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Foto yang kamu ambil akan tampil di sini
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
