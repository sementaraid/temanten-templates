import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, X, CheckCircle, AlertCircle,
  Loader2, RefreshCw, Trash2, Upload,
} from 'lucide-react';
import { useTemantenState, useTemantenStore } from '@temanten/sdk';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

type PhotoStatus = 'pending' | 'uploading' | 'done' | 'error';

type PhotoEntry = {
  localId: string;
  localUrl: string;
  blob: Blob;
  status: PhotoStatus;
};

type EventSlot = { date: string; time: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseEventTime({ date, time }: EventSlot): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setHours(h, m, 0, 0);
  return d;
}

function inEventWindow(ceremony: EventSlot, reception: EventSlot): boolean {
  const now = new Date();
  const cStart = parseEventTime(ceremony);
  const rStart = parseEventTime(reception);
  const start = cStart ?? rStart;
  if (!start) return false;
  const end = rStart
    ? new Date(rStart.getTime() + 4 * 3_600_000)
    : new Date(cStart!.getTime() + 6 * 3_600_000);
  return now >= start && now <= end;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useEventWindow(ceremony: EventSlot, reception: EventSlot): boolean {
  const [active, setActive] = useState(() => inEventWindow(ceremony, reception));
  useEffect(() => {
    const timer = setInterval(
      () => setActive(inEventWindow(ceremony, reception)),
      60_000,
    );
    return () => clearInterval(timer);
  }, [ceremony, reception]);
  return active;
}

function useServerCount(invitationId: string | undefined, guestId: string | null): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!invitationId || !guestId) return;
    fetch(`/api/photos/${invitationId}/count?guestId=${guestId}`)
      .then((r) => r.json())
      .then((data) => setCount(data.count ?? 0))
      .catch(() => {});
  }, [invitationId, guestId]);
  return count;
}

function useCamera() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => { if (!cancelled) setOpen(false); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facingMode]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !ready || capturing) { resolve(null); return; }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      setCapturing(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
      canvas.toBlob((blob) => { setCapturing(false); resolve(blob); }, 'image/jpeg', 0.85);
    });
  }, [ready, capturing]);

  return {
    open, ready, flash, capturing, facingMode,
    videoRef, canvasRef,
    openCamera: () => setOpen(true),
    closeCamera: () => setOpen(false),
    flipFacing: () => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment')),
    onVideoReady: () => setReady(true),
    captureFrame,
  };
}

function usePhotoSession(invitationId: string | undefined, guestId: string | null) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const serverCount = useServerCount(invitationId, guestId);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.localUrl)), []);

  const addPhoto = useCallback((blob: Blob) => {
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPhotos((prev) => [{ localId, localUrl: URL.createObjectURL(blob), blob, status: 'pending' }, ...prev]);
  }, []);

  const removePhoto = useCallback((localId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) URL.revokeObjectURL(target.localUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  const uploadEntry = useCallback(async (entry: PhotoEntry) => {
    if (!invitationId) return;
    const mark = (status: PhotoStatus) =>
      setPhotos((prev) => prev.map((p) => p.localId === entry.localId ? { ...p, status } : p));
    mark('uploading');
    try {
      const fd = new FormData();
      fd.append('photo', entry.blob, 'photo.jpg');
      if (guestId) fd.append('guestId', guestId);
      const res = await fetch(`/api/photos/${invitationId}/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      mark('done');
    } catch {
      mark('error');
    }
  }, [invitationId, guestId]);

  const pending = photos.filter((p) => p.status === 'pending');

  return {
    photos,
    serverCount,
    pending,
    totalCount: serverCount + photos.length,
    doneCount: serverCount + photos.filter((p) => p.status === 'done').length,
    isUploading: photos.some((p) => p.status === 'uploading'),
    addPhoto,
    removePhoto,
    uploadEntry,
    uploadAll: () => Promise.all(pending.map(uploadEntry)),
  };
}

type PhotoSession = ReturnType<typeof usePhotoSession>;

// ─── Sub-components ──────────────────────────────────────────────────────────

function CameraFAB({ doneCount, onPress }: { doneCount: number; onPress: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
      onClick={onPress}
      whileTap={{ scale: 0.88 }}
      aria-label="Abadikan momen"
      className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-[#a85200] shadow-lg shadow-[#a85200]/40 flex items-center justify-center text-white"
    >
      <Camera className="w-6 h-6" />
      {doneCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#a85200] text-[10px] font-bold flex items-center justify-center border border-[#a85200]/20 pointer-events-none">
          {doneCount}
        </span>
      )}
    </motion.button>
  );
}

function PhotoCard({
  photo, onRemove, onRetry,
}: {
  photo: PhotoEntry;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-[#a85200]/10 relative">
      <img src={photo.localUrl} alt="Momen pernikahan" className="w-full h-full object-cover" loading="lazy" />

      {photo.status === 'pending' && (
        <>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            aria-label="Hapus foto"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/40">
            <p className="font-open-sans text-[9px] text-white/80 text-center">Belum diunggah</p>
          </div>
        </>
      )}

      {photo.status === 'uploading' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}

      {photo.status === 'error' && (
        <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1.5 px-2">
          <AlertCircle className="w-4 h-4 text-white" />
          <span className="font-open-sans text-[9px] text-white text-center">Gagal</span>
          <div className="flex gap-1.5 mt-0.5">
            <button type="button" onClick={onRetry} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-open-sans hover:bg-white/30 transition-colors">
              Coba lagi
            </button>
            <button type="button" onClick={onRemove} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-open-sans hover:bg-red-500/60 transition-colors">
              Hapus
            </button>
          </div>
        </div>
      )}

      {photo.status === 'done' && (
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>
  );
}

function CameraViewfinder({
  open, ready, flash, totalCount, canCapture, lastPhoto,
  videoRef, canvasRef, onVideoReady, onCapture, onClose, onFlip,
}: {
  open: boolean;
  ready: boolean;
  flash: boolean;
  totalCount: number;
  canCapture: boolean;
  lastPhoto: PhotoEntry | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onVideoReady: () => void;
  onCapture: () => void;
  onClose: () => void;
  onFlip: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="camera"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black flex flex-col"
        >
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

          <AnimatePresence>
            {!ready && (
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

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={onVideoReady}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4">
            <button type="button" onClick={onClose} aria-label="Tutup kamera"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-semibold font-open-sans">
              {totalCount}/{MAX_PHOTOS}
            </span>
            <button type="button" onClick={onFlip} aria-label="Ganti kamera"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-20 mt-auto flex items-center justify-between px-8 pb-14 pt-6">
            <button type="button" onClick={onClose} aria-label="Lihat galeri"
              className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 border-2 border-white/30 flex-shrink-0">
              {lastPhoto && <img src={lastPhoto.localUrl} alt="Foto terakhir" className="w-full h-full object-cover" />}
            </button>
            <button
              type="button"
              onClick={onCapture}
              disabled={!ready || !canCapture}
              aria-label="Ambil foto"
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
            <div className="w-14 h-14 flex-shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GalleryDrawer({
  open, session, canCapture, onClose, onOpenCamera,
}: {
  open: boolean;
  session: PhotoSession;
  canCapture: boolean;
  onClose: () => void;
  onOpenCamera: () => void;
}) {
  const { photos, serverCount, pending, doneCount, totalCount, isUploading, removePhoto, uploadEntry, uploadAll } = session;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[#faf7f2] dark:bg-[#1a0e05] max-h-[85dvh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#a85200]/30" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <div>
                <h3 className="font-arashveti text-xl font-bold text-[#a85200] dark:text-[#e8a060]">
                  Foto Momenmu
                </h3>
                <p className="font-open-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {doneCount}/{MAX_PHOTOS} foto diunggah
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Tutup"
                className="w-8 h-8 rounded-full bg-[#a85200]/10 flex items-center justify-center text-[#a85200] dark:text-[#e8a060] hover:bg-[#a85200]/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-6 flex-1">
              {canCapture && (
                <button type="button" onClick={onOpenCamera}
                  className="w-full flex flex-col items-center gap-3 py-6 border-2 border-dashed border-[#a85200]/30 rounded-2xl bg-[#a85200]/5 hover:bg-[#a85200]/10 active:bg-[#a85200]/15 transition-colors mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#a85200]/15 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-[#a85200] dark:text-[#e8a060]" />
                  </div>
                  <div className="text-center">
                    <p className="font-open-sans text-sm font-semibold text-[#a85200] dark:text-[#e8a060]">Ambil Foto</p>
                    <p className="font-open-sans text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Sisa {MAX_PHOTOS - totalCount} foto
                    </p>
                  </div>
                </button>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-[#a85200] bg-[#a85200]/8 dark:bg-[#a85200]/15 rounded-xl px-4 py-3 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="font-open-sans">Mengunggah foto…</span>
                </div>
              )}

              {doneCount >= MAX_PHOTOS && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-open-sans">Semua {MAX_PHOTOS} foto sudah diunggah. Terima kasih!</span>
                </div>
              )}

              {photos.length === 0 && serverCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-open-sans">
                    Kamu sudah mengunggah {serverCount} foto sebelumnya.
                    {canCapture && ` Masih bisa ${MAX_PHOTOS - serverCount} foto lagi.`}
                  </span>
                </div>
              )}

              {photos.length > 0 && (
                <div className="mb-5">
                  <p className="font-open-sans text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    Foto Kamu
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p) => (
                      <PhotoCard
                        key={p.localId}
                        photo={p}
                        onRemove={() => removePhoto(p.localId)}
                        onRetry={() => uploadEntry(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {photos.length === 0 && serverCount === 0 && (
                <p className="font-open-sans text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Foto yang kamu ambil akan tampil di sini
                </p>
              )}
            </div>

            {pending.length > 0 && (
              <div className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-[#a85200]/10">
                <button
                  type="button"
                  onClick={uploadAll}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#a85200] text-white font-open-sans text-sm font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform"
                >
                  <Upload className="w-4 h-4" />
                  Unggah {pending.length} Foto
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const GuestPhotoMoment = () => {
  const { invitationData, screenState } = useTemantenState();
  const { guest } = useTemantenStore();
  const { guestId } = guest;
  const { id: invitationId, ceremony, reception } = invitationData;

  const active = useEventWindow(ceremony, reception);
  const camera = useCamera();
  const session = usePhotoSession(invitationId, guestId);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const canCapture = session.totalCount < MAX_PHOTOS && !camera.capturing;

  const openGallery = useCallback(() => {
    camera.closeCamera();
    setGalleryOpen(true);
  }, [camera]);

  const handleCapture = useCallback(async () => {
    const blob = await camera.captureFrame();
    if (!blob) return;
    session.addPhoto(blob);
    if (session.totalCount + 1 >= MAX_PHOTOS) setTimeout(openGallery, 500);
  }, [camera, session, openGallery]);

  if (!active || screenState !== 'main' || !guestId || !invitationId) return null;

  return (
    <>
      <CameraFAB
        doneCount={session.doneCount}
        onPress={() => (canCapture ? camera.openCamera() : setGalleryOpen(true))}
      />
      <CameraViewfinder
        open={camera.open}
        ready={camera.ready}
        flash={camera.flash}
        totalCount={session.totalCount}
        canCapture={canCapture}
        lastPhoto={session.photos[0]}
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        onVideoReady={camera.onVideoReady}
        onCapture={handleCapture}
        onClose={openGallery}
        onFlip={camera.flipFacing}
      />
      <GalleryDrawer
        open={galleryOpen}
        session={session}
        canCapture={canCapture}
        onClose={() => setGalleryOpen(false)}
        onOpenCamera={() => { setGalleryOpen(false); camera.openCamera(); }}
      />
    </>
  );
};
