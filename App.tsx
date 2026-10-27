import React, { useState, useRef, useEffect } from 'react';
import { BarbershopProvider, useBarbershop } from './context/BarbershopContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { ClientView } from './components/client/ClientView';
import { AdminView } from './components/admin/AdminView';
import { AuthModal } from './components/client/AuthModal';
import { AdminNotificationsModal } from './components/admin/AdminNotificationsModal';
import { 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Crown, 
  MessageCircle, 
  Sparkles, 
  CheckCircle2,
  Coffee,
  Film,
  Volume2,
  VolumeX
} from 'lucide-react';

const BarbershopApp: React.FC = () => {
  const { activeView, settings, clientActiveTab, adminActiveTab } = useBarbershop();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Vídeo de fundo persistente em tela cheia (roda continuamente entre todas as abas e visões)
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const [bgVideoActive, setBgVideoActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('estudiovip_bg_video');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [bgVideoMuted, setBgVideoMuted] = useState<boolean>(true);
  const [bgVideoOpacity, setBgVideoOpacity] = useState<'vivid' | 'medium' | 'subtle'>('vivid');

  // Garante o autoplay imediato e contínuo mesmo após trocas de abas/rotas ou políticas de navegador
  useEffect(() => {
    const videoEl = bgVideoRef.current;
    if (!videoEl) return;

    if (bgVideoActive) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoEl.muted = true;
          setBgVideoMuted(true);
          videoEl.play().catch(() => {});
        });
      }
    } else {
      videoEl.pause();
    }
  }, [bgVideoActive, activeView, clientActiveTab, adminActiveTab]);

  const toggleBgVideo = () => {
    setBgVideoActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('estudiovip_bg_video', String(next));
      } catch {}
      return next;
    });
  };

  const toggleBgMute = () => {
    if (!bgVideoRef.current) return;
    const next = !bgVideoMuted;
    bgVideoRef.current.muted = next;
    setBgVideoMuted(next);
  };

  const cycleOpacity = () => {
    setBgVideoOpacity((prev) => {
      if (prev === 'vivid') return 'medium';
      if (prev === 'medium') return 'subtle';
      return 'vivid';
    });
  };

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 overflow-x-hidden">
      {/* VÍDEO DE FUNDO EM TELA CHEIA PERSISTENTE (Camada z-0 fixa na viewport) */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-zinc-950"
      >
        <video
          ref={bgVideoRef}
          src="/assets/aistudio/Barbershop_emblem_on_dark_surface_1080p_20261026141157_6e69fac0.mp4"
          autoPlay
          loop
          muted={bgVideoMuted}
          playsInline
          preload="auto"
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            !bgVideoActive
              ? 'opacity-0'
              : bgVideoOpacity === 'vivid'
              ? 'opacity-60 sm:opacity-70'
              : bgVideoOpacity === 'medium'
              ? 'opacity-40 sm:opacity-50'
              : 'opacity-20 sm:opacity-30'
          }`}
        />
        {/* Máscaras de Contraste Cinematográfico para leitura nítida dos componentes */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/45 via-zinc-950/65 to-zinc-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#09090b_90%)] pointer-events-none" />
      </div>

      {/* Navegação Topo (z-40) */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* Conteúdo Principal Dinâmico sobreposto ao vídeo (z-10) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeView === 'client' ? <ClientView /> : <AdminView />}
      </main>

      {/* Rodapé com translúcido suave (backdrop-blur) para manter o vídeo visível ao fundo */}
      <footer className="relative z-10 bg-zinc-950/85 backdrop-blur-md border-t border-zinc-800/80 mt-16 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-brand font-bold text-base text-zinc-100 tracking-wider">
                  {settings.name}
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed italic">
                "{settings.tagline}"
              </p>
              <div className="pt-1">
                <a
                  href="https://wa.me/556799440532"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors"
                  title="Falar com Mariano no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>+55 67 9944-0532 - Mariano</span>
                </a>
              </div>
            </div>

            {/* Column 2: Address & Contact */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Localização &amp; Contato
              </h4>
              <p className="flex items-start gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {settings.address} <br />
                  {settings.neighborhood} - {settings.city} <br />
                  <span className="text-amber-400/90 text-[11px] font-medium">
                    (Próximo à Escola Pedro Mendes Fontoura)
                  </span>
                </span>
              </p>
              <p className="flex items-center gap-2 text-zinc-400 pt-1">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href="https://wa.me/556799440532" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline font-mono text-zinc-200"
                >
                  +55 67 9944-0532 (Mariano)
                </a>
              </p>
            </div>

            {/* Column 3: Hours & Policy */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Horário de Atendimento
              </h4>
              <p className="text-zinc-400">
                <strong className="text-zinc-300">Segunda a Sábado:</strong> <br />
                08:30h às 12:00h • 14:00h às 19:00h
              </p>
              <p className="text-zinc-400">
                <strong className="text-zinc-300">Domingo:</strong> Fechada
              </p>
              <p className="text-amber-400/90 text-[11px] pt-1 leading-snug">
                * Domingo fechada e algumas segundas do mês também (avisado previamente com antecedência no app).
              </p>
            </div>

            {/* Column 4: Amenities */}
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Diferenciais Estúdio VIP
              </h4>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-2 text-amber-300">
                  <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Café quentinho &amp; água gelada de cortesia para melhor recebê-lo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Ambiente 100% climatizado
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Cortes alinhados &amp; navalhados
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Agendamento pontual sem filas
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>© {new Date().getFullYear()} {settings.name}. Coxim - MS. Todos os direitos reservados.</p>
            <p className="text-zinc-400 font-brand italic text-xs">
              "{settings.tagline}"
            </p>
          </div>
        </div>
      </footer>

      {/* Modais Globais & Toasts */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AdminNotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />

      {/* Controlador Flutuante do Vídeo em Tela Cheia */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleBgVideo}
          className={`group px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md border transition-all flex items-center gap-2 shadow-2xl ${
            bgVideoActive
              ? 'bg-zinc-950/90 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-zinc-900'
              : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-zinc-200'
          }`}
          title={bgVideoActive ? 'Pausar vídeo de fundo' : 'Ativar vídeo de fundo'}
        >
          <Film className={`w-3.5 h-3.5 ${bgVideoActive ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">
            Fundo 3D: {bgVideoActive ? 'Full Rodando' : 'Pausado'}
          </span>
        </button>

        {bgVideoActive && (
          <>
            <button
              type="button"
              onClick={toggleBgMute}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md bg-zinc-950/90 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-all flex items-center gap-1.5 shadow-lg"
              title={bgVideoMuted ? 'Ativar som do vídeo' : 'Silenciar som do vídeo'}
            >
              {bgVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              <span className="hidden md:inline">{bgVideoMuted ? 'Mudo' : 'Som Ligado'}</span>
            </button>

            <button
              type="button"
              onClick={cycleOpacity}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md bg-zinc-950/90 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition-all shadow-lg hidden sm:flex items-center gap-1"
              title="Ajustar intensidade do vídeo de fundo"
            >
              <span>Brilho: {bgVideoOpacity === 'vivid' ? 'Alto (70%)' : bgVideoOpacity === 'medium' ? 'Médio (50%)' : 'Suave (30%)'}</span>
            </button>
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <BarbershopProvider>
      <BarbershopApp />
    </BarbershopProvider>
  );
}
