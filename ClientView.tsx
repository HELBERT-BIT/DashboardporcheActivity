import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BookingWizard } from './BookingWizard';
import { MyAppointments } from './MyAppointments';
import { AnnouncementsFeed } from './AnnouncementsFeed';
import { BarberProfileView } from './BarberProfileView';
import { HeroVideoShowcase } from './HeroVideoShowcase';
import { 
  Scissors, 
  Clock, 
  MapPin, 
  CalendarDays, 
  ShieldCheck, 
  ChevronRight, 
  Megaphone,
  Crown,
  Sparkles,
  Phone,
  Coffee,
  Star
} from 'lucide-react';

export const ClientView: React.FC = () => {
  const { 
    settings, 
    services, 
    clientActiveTab, 
    setClientActiveTab, 
    isOpenNow,
    announcements,
    getBarberRatingStats 
  } = useBarbershop();

  const stats = getBarberRatingStats();

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | undefined>(undefined);

  const status = isOpenNow();
  const importantAnnouncement = announcements.find((a) => a.active && a.important);

  const categories: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todos os Serviços' },
    { id: 'cabelo', label: 'Cortes de Cabelo' },
    { id: 'barba', label: 'Barba' },
    { id: 'sobrancelha', label: 'Sobrancelha' },
  ];

  const filteredServices = services.filter((s) => {
    if (!s.active) return false;
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  const handleBookServiceDirectly = (serviceId: string) => {
    setPreSelectedServiceId(serviceId);
    setClientActiveTab('booking');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Showcase Banner with Featured 3D Video */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/75 via-zinc-950/80 to-zinc-950/85 backdrop-blur-md border border-amber-500/30 shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (lg:col-span-7): Brand Info, Badges, CTAs, Amenities */}
          <div className="lg:col-span-7 space-y-5">
            {/* Status pill & location tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  status.isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                ></span>
                {status.isOpen 
                  ? (status.isManualOverride ? 'Barbearia Aberta Hoje (Confirmado pelo Barbeiro)' : 'Barbearia Aberta')
                  : (status.isManualOverride ? 'Fechada no Momento pelo Proprietário' : 'Barbearia Fechada no Momento')}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {settings.address} - {settings.neighborhood}, Coxim - MS
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-3.5 h-3.5" />
                Atendimento VIP
              </span>

              {/* Barber Rating & Reviews Pill */}
              <button
                type="button"
                onClick={() => setClientActiveTab('barber')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all shadow-sm group cursor-pointer"
                title="Clique para ver o perfil e avaliações do barbeiro Mariano"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{stats.average} ({stats.count} avaliações)</span>
                <span className="text-[10px] text-amber-400/80 group-hover:text-amber-200 underline ml-0.5 hidden sm:inline">
                  • Ver Perfil de Mariano
                </span>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-5xl font-black font-brand tracking-tight text-zinc-100 leading-tight">
                  {settings.name}
                </h1>
              </div>
              <p className="text-base sm:text-lg text-amber-400 font-brand font-semibold italic mt-1">
                "{settings.tagline}"
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                Localizada no bairro São Judas Tadeu, próximo à <strong>Escola Pedro Mendes Fontoura</strong> em Coxim - MS. 
                Atendimento de segunda a sábado das 08:30h às 12:00h e das 14:00h às 19:00h. Agende seu horário com antecedência!
              </p>

              {/* Special manual open announcement for clients */}
              {status.isOpen && status.isManualOverride && (
                <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <div>
                    <strong className="text-white uppercase tracking-wide">Atendimento Aberto Hoje:</strong>{' '}
                    O barbeiro Mariano ativou o expediente para hoje! Os horários já estão liberados no agendamento online.
                  </div>
                </div>
              )}
            </div>

            {/* Quick CTA Actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => {
                  setPreSelectedServiceId(undefined);
                  setClientActiveTab('booking');
                }}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4 text-zinc-950" />
                <span>Agendar Horário Online</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setClientActiveTab('services')}
                className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Ver Serviços &amp; Preços</span>
              </button>
            </div>

            {/* Differentials & Rules Highlight Grid */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block">Cortesia Exclusiva:</strong>
                  <span className="text-zinc-300 text-[11px]">
                    Café quentinho &amp; água gelada de cortesia.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Tolerância 10 min:</strong>
                  <span className="text-zinc-400 text-[11px]">
                    Chegue 5 a 10 min antes. Pontualidade rigorosa.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Horários:</strong>
                  <span className="text-zinc-400 text-[11px]">
                    Seg a Sáb (08:30 às 19:00). Domingo sob aviso.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Featured 3D Video Showcase (Parte Principal) */}
          <div className="lg:col-span-5 space-y-2">
            <HeroVideoShowcase />
            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Vídeo Oficial Estúdio VIP</span>
              </span>
              <span className="text-zinc-500">1080p Full HD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Important Announcement Micro Banner if present */}
      {importantAnnouncement && (
        <div 
          onClick={() => setClientActiveTab('announcements')}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Mural de Avisos &amp; Novidades
              </span>
              <p className="text-xs text-zinc-200 font-medium">{importantAnnouncement.title}</p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 shrink-0">
            Ver aviso <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Tab Navigation for Mobile & Content switcher */}
      <div className="flex border-b border-zinc-800 gap-2 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setClientActiveTab('booking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            clientActiveTab === 'booking'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Agendar Horário
        </button>
        <button
          onClick={() => setClientActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            clientActiveTab === 'services'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          Tabela de Serviços &amp; Preços
        </button>
        <button
          onClick={() => setClientActiveTab('my-appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            clientActiveTab === 'my-appointments'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Meus Agendamentos
        </button>
        <button
          onClick={() => setClientActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            clientActiveTab === 'announcements'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Mural de Avisos &amp; Novidades
        </button>
        <button
          onClick={() => setClientActiveTab('barber')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            clientActiveTab === 'barber'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
          Perfil &amp; Avaliações ({stats.average}★)
        </button>
      </div>

      {/* Main Tab Content Display */}
      {clientActiveTab === 'booking' && (
        <BookingWizard 
          onBookingSuccess={() => setClientActiveTab('my-appointments')} 
          preSelectedServiceId={preSelectedServiceId}
        />
      )}

      {clientActiveTab === 'my-appointments' && <MyAppointments />}

      {clientActiveTab === 'announcements' && <AnnouncementsFeed />}

      {clientActiveTab === 'barber' && <BarberProfileView />}

      {clientActiveTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-brand text-zinc-100">
                Tabela Oficial de Serviços &amp; Preços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Estúdio VIP Barbearia • Coxim - MS • Valores originais conforme tabela oficial.
              </p>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg hover:shadow-amber-500/5"
              >
                {/* Service Image Header */}
                <div className="relative w-full h-48 sm:h-52 bg-zinc-950 overflow-hidden">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-amber-400 ${service.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    <Scissors className="w-12 h-12 opacity-30" />
                  </div>

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-950/20 to-transparent pointer-events-none" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                      {service.category}
                    </span>
                    {service.popular && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-zinc-950 shadow-md">
                        Mais Pedido
                      </span>
                    )}
                  </div>

                  {/* Price Tag Overlay at the base */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80">
                    <span className="font-brand text-base font-bold text-amber-400 tabular-nums">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-lg group-hover:text-amber-400 transition-colors mb-2">
                      {service.name}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} minutos
                    </span>

                    <button
                      onClick={() => handleBookServiceDirectly(service.id)}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                    >
                      <span>Agendar Horário</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
