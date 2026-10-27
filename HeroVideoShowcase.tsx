import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X, 
  Sparkles, 
  Crown,
  Film
} from 'lucide-react';

interface HeroVideoShowcaseProps {
  videoSrc?: string;
}

export const HeroVideoShowcase: React.FC<HeroVideoShowcaseProps> = ({
  videoSrc = '/assets/aistudio/Barbershop_emblem_on_dark_surface_1080p_20261026141157_6e69fac0.mp4'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Attempt auto-play on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback if browser blocks autoplay with sound
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => setIsPlaying(false));
        }
      });
    }
  }, []);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleOpenModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className="relative group rounded-3xl overflow-hidden border border-amber-500/30 bg-zinc-950 shadow-2xl shadow-amber-500/10 transition-all hover:border-amber-500/50"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Glow ambient highlight behind video */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent blur-xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

        {/* Video Element */}
        <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={handleTogglePlay}
            className="w-full h-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-700"
          />

          {/* Vignette & Soft Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 shadow">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Estúdio VIP Oficial</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>1080p HD</span>
            </span>
          </div>

          {/* Bottom Overlay & Motto */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2 z-10">
            <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 pointer-events-none">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                Barbearia Estúdio VIP
              </span>
              <p className="text-xs font-bold font-brand text-amber-400 italic">
                "Estilo não é moda, é atitude"
              </p>
            </div>

            {/* Quick Interactive Control Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-xl bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700 hover:border-amber-400 backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-xl bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700 hover:border-amber-400 backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                title={isPlaying ? 'Pausar Vídeo' : 'Reproduzir Vídeo'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Expand / Cinema Modal */}
              <button
                type="button"
                onClick={handleOpenModal}
                className="w-8 h-8 rounded-xl bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700 hover:border-amber-400 backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                title="Assistir em Tela Cheia / Cinema"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Cinema Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div 
            className="relative w-full max-w-4xl bg-zinc-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold font-brand text-zinc-100">
                  Estúdio VIP Barbearia • Vídeo Oficial
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Video Player with standard controls */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={modalVideoRef}
                src={videoSrc}
                autoPlay
                controls
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <p className="italic text-amber-400 font-semibold font-brand">
                "Estilo não é moda, é atitude!" • Coxim - MS
              </p>
              <button
                type="button"
                onClick={handleCloseModal}
                className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
              >
                Fechar Cinema
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
