import React, { useState, useMemo } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberService, PaymentMethod } from '../../types';
import { getTodayString, getOffsetDateString } from '../../data/initialData';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  QrCode, 
  Copy, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Phone,
  Mail,
  FileText,
  BadgeAlert,
  Banknote,
  Wallet
} from 'lucide-react';

interface BookingWizardProps {
  onBookingSuccess: () => void;
  preSelectedServiceId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ 
  onBookingSuccess, 
  preSelectedServiceId 
}) => {
  const { 
    services, 
    settings, 
    getAvailableSlots, 
    createAppointment, 
    currentUser, 
    showToast,
    setClientActiveTab 
  } = useBarbershop();

  const [currentStep, setCurrentStep] = useState<number>(preSelectedServiceId ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preSelectedServiceId || (services[0]?.id || ''));
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = getTodayString();
    const now = new Date();
    const todayOfWeek = now.getDay();
    const todayConfig = settings.workingDays.find((d) => d.dayOfWeek === todayOfWeek);
    const isTodayOpen = settings.manualOverrideStatus === 'open' || 
      (settings.manualOverrideStatus !== 'closed' && !!(todayConfig && todayConfig.active));

    if (isTodayOpen) return todayStr;

    for (let i = 1; i < 14; i++) {
      const nextDateStr = getOffsetDateString(i);
      const [y, m, d] = nextDateStr.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      const cfg = settings.workingDays.find((wd) => wd.dayOfWeek === dow);
      if (cfg && cfg.active) {
        return nextDateStr;
      }
    }
    return todayStr;
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client details
  const [clientName, setClientName] = useState<string>(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState<string>(currentUser?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(currentUser?.email || '');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Payment choice
  const [paymentType, setPaymentType] = useState<'antecipado' | 'presencial'>('antecipado');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [cashChangeOption, setCashChangeOption] = useState<'exact' | '50' | '100' | 'custom'>('exact');
  const [customCashChange, setCustomCashChange] = useState<string>('');

  // Result of created appointment
  const [createdAptId, setCreatedAptId] = useState<string | null>(null);

  // Keep client details synced with currentUser if logged in
  React.useEffect(() => {
    if (currentUser) {
      if (!clientName) setClientName(currentUser.name);
      if (!clientPhone) setClientPhone(currentUser.phone);
      if (!clientEmail) setClientEmail(currentUser.email);
    }
  }, [currentUser]);

  // Generate next 14 calendar days for quick selection
  const upcomingDays = useMemo(() => {
    const days = [];
    const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayStr = getTodayString();

    for (let i = 0; i < 14; i++) {
      const dateStr = getOffsetDateString(i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dayConfig = settings.workingDays.find((wd) => wd.dayOfWeek === dayOfWeek);

      const isToday = i === 0 || dateStr === todayStr;
      
      // Automatic house rule: Sunday (dayOfWeek === 0) is closed by default unless activated by owner
      let isOpen = !!(dayConfig && dayConfig.active);
      let isManualOpenToday = false;

      if (isToday) {
        if (settings.manualOverrideStatus === 'open') {
          isOpen = true;
          isManualOpenToday = true;
        } else if (settings.manualOverrideStatus === 'closed') {
          isOpen = false;
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        monthName: dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        weekdayName: weekdaysShort[dayOfWeek],
        isOpen,
        isToday,
        isManualOpenToday,
      });
    }
    return days;
  }, [settings.workingDays, settings.manualOverrideStatus]);

  // If owner manually opens today, automatically switch selectedDate to today so slots are visible right away
  React.useEffect(() => {
    const todayStr = getTodayString();
    if (settings.manualOverrideStatus === 'open') {
      setSelectedDate(todayStr);
    }
  }, [settings.manualOverrideStatus]);

  // If currently selected date is closed, automatically fallback to the first open day
  React.useEffect(() => {
    const currentDay = upcomingDays.find((d) => d.dateStr === selectedDate);
    if (currentDay && !currentDay.isOpen) {
      const firstOpen = upcomingDays.find((d) => d.isOpen);
      if (firstOpen) {
        setSelectedDate(firstOpen.dateStr);
        setSelectedTime('');
      }
    }
  }, [upcomingDays, selectedDate]);

  // Slots for the currently selected date
  const availableSlots = useMemo(() => {
    return getAvailableSlots(selectedDate);
  }, [selectedDate, getAvailableSlots, settings.manualOverrideStatus, settings.blockedSlotsByDate, settings.customUnlockedSlotsByDate]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Formatting phone number on input
  const handlePhoneChange = (val: string) => {
    // Only numbers
    const digits = val.replace(/\D/g, '').substring(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
    setClientPhone(formatted);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    showToast('Chave Pix copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmBooking = () => {
    if (!selectedService) return;
    if (!selectedDate || !selectedTime) {
      showToast('Por favor, selecione um dia e horário livre.', 'error');
      setCurrentStep(2);
      return;
    }
    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      showToast('Por favor, informe seu nome completo e WhatsApp válido.', 'error');
      setCurrentStep(3);
      return;
    }

    let finalNotes = clientNotes.trim();
    if (paymentType === 'presencial') {
      const methodLabels: Record<PaymentMethod, string> = {
        pix: 'Pix no Balcão (QR Code)',
        cartao_credito: 'Cartão de Crédito',
        cartao_debito: 'Cartão de Débito',
        dinheiro: 'Dinheiro em Espécie',
      };
      let changeText = '';
      if (paymentMethod === 'dinheiro') {
        if (cashChangeOption === '50') changeText = ' • Precisa de troco para R$ 50,00';
        else if (cashChangeOption === '100') changeText = ' • Precisa de troco para R$ 100,00';
        else if (cashChangeOption === 'custom' && customCashChange) changeText = ` • Precisa de troco para ${customCashChange}`;
        else changeText = ' • Levará valor exato (sem troco)';
      }
      const paymentTag = `[Pagamento presencial: ${methodLabels[paymentMethod]}${changeText}]`;
      finalNotes = finalNotes ? `${paymentTag} • ${finalNotes}` : paymentTag;
    }

    const created = createAppointment({
      serviceId: selectedService.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      date: selectedDate,
      time: selectedTime,
      paymentType,
      paymentMethod,
      notes: finalNotes || undefined,
    });

    if (created) {
      setCreatedAptId(created.id);
      setCurrentStep(5);
    }
  };

  const selectedDateObject = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const formattedSelectedDate = selectedDateObject.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden">
      {/* Wizard Header Progress */}
      <div className="bg-zinc-950/80 backdrop-blur-md p-6 border-b border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Agendamento Online
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">Confirmação Imediata</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100 mt-1">
              {currentStep === 1 && 'Escolha o Serviço'}
              {currentStep === 2 && 'Escolha Data & Horário Livre'}
              {currentStep === 3 && 'Seus Dados de Contato'}
              {currentStep === 4 && 'Pagamento & Tolerância'}
              {currentStep === 5 && 'Agendamento Confirmado!'}
            </h2>
          </div>

          {/* Stepper pills */}
          {currentStep < 5 && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  onClick={() => {
                    // Allow navigating backwards or forwards if valid
                    if (step < currentStep) setCurrentStep(step);
                    else if (step === 2 && selectedServiceId) setCurrentStep(2);
                    else if (step === 3 && selectedTime) setCurrentStep(3);
                    else if (step === 4 && clientName && clientPhone) setCurrentStep(4);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                    currentStep === step
                      ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20'
                      : step < currentStep
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Essential Rule Banner about Tolerance */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
          <BadgeAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Regra de Pontualidade &amp; Tolerância:</span>{' '}
            Chegue entre <strong className="text-white">5 e 10 minutos antes</strong> do horário marcado. 
            Nosso sistema tem <strong className="text-white">tolerância máxima de 10 minutos</strong>. Caso ultrapasse esse tempo sem check-in no balcão, o horário é automaticamente cancelado e liberado para outros clientes.
          </div>
        </div>
      </div>

      {/* Wizard Content Body */}
      <div className="p-6">
        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Selecione o serviço desejado para visualizar a disponibilidade na agenda do profissional:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services
                .filter((s) => s.active)
                .map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`relative rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                        isSelected
                          ? 'border-amber-500 bg-zinc-900 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                          : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      {/* Service Image Banner with fallback */}
                      <div className="relative w-full h-40 sm:h-44 bg-zinc-950 overflow-hidden">
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
                          <Scissors className="w-10 h-10 opacity-40" />
                        </div>
                        {/* Gradient Scrim for contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none" />

                        {/* Badges Overlay */}
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

                        {/* Selected Indicator Badge */}
                        {isSelected && (
                          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Selecionado</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition-colors">
                              {service.name}
                            </h4>
                            <span className="font-brand text-lg font-bold text-amber-400 tabular-nums whitespace-nowrap">
                              R$ {service.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                          <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {service.durationMinutes} min
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedServiceId(service.id);
                              setCurrentStep(2);
                            }}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-amber-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                            }`}
                          >
                            <span>{isSelected ? 'Avançar' : 'Escolher'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={() => setCurrentStep(2)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>Avançar para Data &amp; Horário</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Date & Time */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Selected service summary pill */}
            {selectedService && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedService.imageUrl ? (
                      <img
                        src={selectedService.imageUrl}
                        alt={selectedService.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Scissors className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-medium">Serviço Selecionado:</span>
                    <h5 className="text-sm font-bold text-zinc-100">{selectedService.name}</h5>
                    <span className="text-[11px] text-zinc-400">{selectedService.durationMinutes} min</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-400 font-brand">
                    R$ {selectedService.price.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="block text-[11px] text-amber-400 hover:text-amber-300 underline mt-0.5"
                  >
                    Trocar serviço
                  </button>
                </div>
              </div>
            )}

            {/* Date Selection: horizontal carousel of upcoming 14 days */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  1. Escolha a Data
                </label>
                <span className="text-xs text-amber-400 font-medium capitalize">
                  {formattedSelectedDate}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {upcomingDays.map((day) => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      disabled={!day.isOpen}
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedTime(''); // Reset time when date changes
                      }}
                      className={`relative flex flex-col items-center justify-center min-w-[76px] p-2.5 rounded-2xl border transition-all ${
                        !day.isOpen
                          ? 'border-zinc-800/40 bg-zinc-950/40 opacity-45 cursor-not-allowed text-zinc-600'
                          : isSelected
                          ? 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                          : day.isManualOpenToday
                          ? 'border-emerald-500/60 bg-emerald-950/30 text-zinc-200 hover:border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                      }`}
                      title={!day.isOpen ? 'Fechado (Norma da casa)' : day.isManualOpenToday ? 'Aberto hoje pelo barbeiro!' : 'Dia com expediente normal'}
                    >
                      {day.isManualOpenToday && !isSelected && (
                        <span className="absolute -top-1.5 right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500 text-zinc-950 shadow animate-pulse">
                          Aberto Hoje
                        </span>
                      )}
                      {!day.isOpen && (
                        <span className="absolute -top-1.5 px-1 py-0.2 rounded text-[7px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500">
                          Fechado
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-zinc-900' : day.isManualOpenToday ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                        {day.weekdayName}
                      </span>
                      <span className="text-lg font-bold font-brand my-0.5">
                        {day.dayNumber}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-medium' : day.isManualOpenToday ? 'text-emerald-300 font-bold' : 'text-zinc-500'}`}>
                        {day.isToday ? 'Hoje' : day.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  2. Horários Disponíveis para {selectedDate === getTodayString() ? 'Hoje' : 'esta Data'}
                </label>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Livre
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span> Ocupado / Indisponível
                  </span>
                </div>
              </div>

              {/* Special notice if opened manually today */}
              {selectedDate === getTodayString() && settings.manualOverrideStatus === 'open' && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white">Expediente Aberto Hoje pelo Barbeiro!</strong>{' '}
                    O barbeiro Mariano ativou o atendimento para hoje. Escolha seu horário disponível abaixo:
                  </div>
                </div>
              )}

              {availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400">
                  <p className="font-semibold text-zinc-200">
                    {selectedDate === getTodayString() && settings.manualOverrideStatus === 'closed'
                      ? 'Barbearia desativada hoje pelo proprietário.'
                      : selectedDate === getTodayString()
                      ? 'Barbearia fechada hoje (Norma da casa: Fechada aos domingos).'
                      : 'Barbearia fechada nesta data (Norma da casa).'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedDate === getTodayString()
                      ? 'A barbearia só abre aos domingos se o proprietário ativar o expediente. Selecione outro dia com expediente ativo acima.'
                      : 'Por favor, selecione outro dia com expediente ativo no calendário acima.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;

                    if (slot.isLunchBreak) {
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-center opacity-40 cursor-not-allowed"
                          title="Intervalo de Almoço da barbearia"
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[9px] text-zinc-600">Almoço</span>
                        </div>
                      );
                    }

                    if (slot.isBlockedByOwner) {
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60 text-center opacity-40 cursor-not-allowed group"
                          title="Horário indisponível por decisão do barbeiro"
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[9px] text-rose-400/80">
                            Indisponível
                          </span>
                        </div>
                      );
                    }

                    if (!slot.isAvailable) {
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center opacity-50 cursor-not-allowed group"
                          title="Horário já reservado por outro cliente"
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[9px] text-zinc-500 group-hover:text-amber-500/70">
                            Reservado
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25 scale-105'
                            : 'bg-zinc-950 border-emerald-500/30 hover:border-amber-500/60 text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="text-sm font-bold block">{slot.time}</span>
                        <span
                          className={`text-[10px] block mt-0.5 font-medium ${
                            isSelected ? 'text-zinc-950' : 'text-emerald-400'
                          }`}
                        >
                          {isSelected ? 'Escolhido' : 'Disponível'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Voltar aos Serviços
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setCurrentStep(3)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>Confirmar Horário: {selectedTime || 'Selecione'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Client Details */}
        {currentStep === 3 && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="text-center pb-2">
              <h4 className="text-lg font-bold text-zinc-100 font-brand">Informações do Cliente</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Usamos seu WhatsApp para enviar confirmação e atualizações do seu agendamento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome e sobrenome"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Telefone com WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Ex: DDD + 9 dígitos (necessário para contato e identificação).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Preferências ou Observações (Opcional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    placeholder="Ex: Prefiro navalha tradicional, barba bem alinhada, etc."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Voltar aos Horários
              </button>
              <button
                type="button"
                disabled={!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10}
                onClick={() => setCurrentStep(4)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>Avançar para Pagamento</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Payment & Final Confirmation */}
        {currentStep === 4 && selectedService && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Mode Selection */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Como prefere pagar?
                </h4>

                {/* Option 1: Pre-payment via Pix */}
                <div
                  onClick={() => {
                    setPaymentType('antecipado');
                    setPaymentMethod('pix');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentType === 'antecipado'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      Pagamento Antecipado via Pix
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Mais Rápido
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Pague com Pix agora e chegue na barbearia pronto para ser atendido sem precisar passar pelo caixa.
                  </p>
                </div>

                {/* Option 2: Pay on Site */}
                <div
                  onClick={() => {
                    setPaymentType('presencial');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentType === 'presencial'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-zinc-400" />
                      Pagamento Presencial (no Balcão)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                      Na hora
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Efetue o pagamento na barbearia ao finalizar o atendimento (Pix, Cartão de Crédito/Débito ou Dinheiro).
                  </p>
                </div>

                {/* Caixinhas dos Métodos de Pagamento Presencial (Para adiantar ao proprietário) */}
                {paymentType === 'presencial' && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-3.5 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-amber-400" />
                          Como você pretende acertar no balcão?
                        </span>
                        <span className="text-[10px] text-zinc-400">Controle do Barbeiro</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Selecione a caixinha abaixo para especificar e adiantar ao proprietário (Mariano). Isso agiliza o seu atendimento e prepara o caixa:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Caixinha 1: Pix no Balcão */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          paymentMethod === 'pix'
                            ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            Pix no Balcão
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            paymentMethod === 'pix' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            QR Code
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Pagar via celular lendo o QR Code do balcão na hora.
                        </p>
                      </button>

                      {/* Caixinha 2: Cartão de Crédito */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cartao_credito')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          paymentMethod === 'cartao_credito'
                            ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            Cartão de Crédito
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            paymentMethod === 'cartao_credito' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            Maquininha
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Aproximação ou chip na maquininha na barbearia.
                        </p>
                      </button>

                      {/* Caixinha 3: Cartão de Débito */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cartao_debito')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          paymentMethod === 'cartao_debito'
                            ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-cyan-400" />
                            Cartão de Débito
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            paymentMethod === 'cartao_debito' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            À Vista
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Débito bancário imediato na maquininha física.
                        </p>
                      </button>

                      {/* Caixinha 4: Dinheiro em Espécie */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('dinheiro')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          paymentMethod === 'dinheiro'
                            ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-amber-400" />
                            Dinheiro em Espécie
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            paymentMethod === 'dinheiro' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            Cédulas
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Pagamento direto em dinheiro no balcão da barbearia.
                        </p>
                      </button>
                    </div>

                    {/* Especificação de Troco se Dinheiro */}
                    {paymentMethod === 'dinheiro' && (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 mt-2">
                        <span className="text-[11px] font-bold text-amber-400 block">
                          Precisa de troco para o barbeiro já deixar separado?
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('exact')}
                            className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === 'exact'
                                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Valor Exato
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('50')}
                            className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === '50'
                                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Troco p/ R$ 50
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('100')}
                            className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === '100'
                                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Troco p/ R$ 100
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('custom')}
                            className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === 'custom'
                                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Outro Valor
                          </button>
                        </div>

                        {cashChangeOption === 'custom' && (
                          <input
                            type="text"
                            placeholder="Ex: Troco para R$ 70,00"
                            value={customCashChange}
                            onChange={(e) => setCustomCashChange(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 mt-1"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pix simulated box if prepaid */}
                {paymentType === 'antecipado' && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Chave Pix Fictícia (Simulação)
                      </span>
                      <span className="text-[11px] text-zinc-400">{settings.pixKeyType}</span>
                    </div>

                    {/* QR Code Mock Box */}
                    <div className="flex items-center gap-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                        {/* High fidelity SVG simulated QR code */}
                        <svg className="w-full h-full text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm0-4h4v2h-4v-2zm-4 4h2v4h-2v-4zm-2-4h2v2h-2v-2zm4 2h2v2h-2v-2zm-2 2h2v2h-2v-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-zinc-300 truncate">
                          {settings.pixKey}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Favorecido: {settings.pixReceiverName}
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedPix ? 'Chave Copiada!' : 'Copiar Chave Pix'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Card & Rules */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                    Resumo do Agendamento
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Cliente:</span>
                      <span className="font-semibold text-zinc-200">{clientName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">WhatsApp:</span>
                      <span className="font-semibold text-zinc-200 font-mono">{clientPhone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Serviço:</span>
                      <div className="flex items-center gap-2">
                        {selectedService.imageUrl && (
                          <img
                            src={selectedService.imageUrl}
                            alt=""
                            className="w-5 h-5 rounded object-cover border border-zinc-800"
                          />
                        )}
                        <span className="font-semibold text-zinc-200">{selectedService.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Data marcada:</span>
                      <span className="font-semibold text-amber-400 capitalize">{formattedSelectedDate}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="font-bold text-amber-400 text-sm">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Forma de Pagamento:</span>
                      <span className="font-semibold text-right">
                        {paymentType === 'antecipado' ? (
                          <span className="text-emerald-400 font-bold">Pix Antecipado (Pago)</span>
                        ) : (
                          <span className="text-amber-400 font-bold">
                            {paymentMethod === 'pix' && 'Presencial: Pix no Balcão'}
                            {paymentMethod === 'cartao_credito' && 'Presencial: Cartão de Crédito'}
                            {paymentMethod === 'cartao_debito' && 'Presencial: Cartão de Débito'}
                            {paymentMethod === 'dinheiro' && (
                              <>
                                Presencial: Dinheiro
                                {cashChangeOption === '50' && ' (Troco p/ R$ 50)'}
                                {cashChangeOption === '100' && ' (Troco p/ R$ 100)'}
                                {cashChangeOption === 'custom' && customCashChange && ` (Troco: ${customCashChange})`}
                                {cashChangeOption === 'exact' && ' (Sem Troco)'}
                              </>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="font-bold text-zinc-300">Total a pagar:</span>
                      <span className="font-bold text-amber-400 font-brand text-lg">
                        R$ {selectedService.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Tolerance callout */}
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Tolerância de 10 minutos
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Seu horário está garantido até as{' '}
                      <strong className="text-amber-400">
                        {(() => {
                          const [h, m] = selectedTime.split(':').map(Number);
                          const d = new Date();
                          d.setHours(h, m + 10, 0, 0);
                          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                        })()}
                      </strong>
                      . Por favor chegue entre 5 a 10 min antes.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5 text-zinc-950" />
                    <span>Confirmar Agendamento Imediato</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Voltar e alterar dados
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation Screen */}
        {currentStep === 5 && selectedService && (
          <div className="p-6 sm:p-8 text-center max-w-lg mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Check className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-2">
                Reserva Confirmada com Sucesso
              </span>
              <h3 className="text-2xl font-bold font-brand text-zinc-100">
                Nos vemos na barbearia!
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Seu agendamento foi registrado e a disponibilidade já foi atualizada na agenda.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Protocolo</span>
                  <p className="text-xs font-mono font-bold text-amber-400">{createdAptId}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Status</span>
                  <p className="text-xs font-bold text-emerald-400">Agendado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {selectedService.imageUrl && (
                    <img
                      src={selectedService.imageUrl}
                      alt={selectedService.name}
                      className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Serviço:</span>
                    <strong className="text-zinc-200 text-xs">{selectedService.name}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block">Cliente:</span>
                  <strong className="text-zinc-200">{clientName}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Data:</span>
                  <strong className="text-amber-400 capitalize">{formattedSelectedDate}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Horário Marcado:</span>
                  <strong className="text-amber-400 font-brand text-base">{selectedTime}</strong>
                </div>

                <div className="col-span-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Forma de Acerto:</span>
                    <strong className="text-zinc-200">
                      {paymentType === 'antecipado'
                        ? '⚡ Pix Antecipado'
                        : `Presencial • ${
                            paymentMethod === 'pix'
                              ? '📱 Pix no Balcão'
                              : paymentMethod === 'cartao_credito'
                              ? '💳 Cartão de Crédito'
                              : paymentMethod === 'cartao_debito'
                              ? '💳 Cartão de Débito'
                              : '💵 Dinheiro em Espécie'
                          }`}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 block text-[10px] uppercase">Valor do Serviço:</span>
                    <strong className="text-amber-400 font-brand text-base">
                      R$ {selectedService.price.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold">⏰ Lembrete Importante:</p>
                <p className="text-[11px] text-zinc-300">
                  Chegue entre <strong>5 e 10 minutos antes</strong>. A tolerância máxima é de <strong>10 minutos</strong> após o horário marcado.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setClientActiveTab('my-appointments');
                  onBookingSuccess();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
              >
                Ver Meus Agendamentos
              </button>
              <button
                type="button"
                onClick={() => {
                  // Reset wizard for another booking
                  setCurrentStep(1);
                  setSelectedTime('');
                }}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Fazer Novo Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
