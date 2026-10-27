import React, { useState, useMemo } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { getTodayString, getOffsetDateString } from '../../data/initialData';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  RotateCcw, 
  Sun, 
  Sunset, 
  Coffee, 
  User, 
  Phone,
  Power,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const AdminSlotManager: React.FC = () => {
  const { 
    settings, 
    getAvailableSlots, 
    toggleSlotBlocked, 
    blockMultipleSlots, 
    unblockAllSlotsForDate, 
    toggleLunchSlotUnlocked,
    setManualBarbershopStatus,
    updateWorkingDay,
    setAdminActiveTab,
    showToast 
  } = useBarbershop();

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick dates for carousel (next 7 days)
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const dStr = getOffsetDateString(i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay();
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      list.push({
        dateStr: dStr,
        dayNumber: d,
        monthName: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        weekday: weekdays[dayOfWeek],
        isToday: i === 0,
        dayOfWeek,
      });
    }
    return list;
  }, []);

  // Parse selected date info
  const selectedDateInfo = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    const dayConfig = settings.workingDays.find((wd) => wd.dayOfWeek === dayOfWeek);
    const isToday = selectedDate === todayStr;
    const isSunday = dayOfWeek === 0;

    let isOpen = !!(dayConfig && dayConfig.active);
    if (isToday) {
      if (settings.manualOverrideStatus === 'open') isOpen = true;
      else if (settings.manualOverrideStatus === 'closed') isOpen = false;
    }

    const fullFormatted = dt.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      dayOfWeek,
      dayConfig,
      isOpen,
      isToday,
      isSunday,
      fullFormatted,
    };
  }, [selectedDate, settings.workingDays, settings.manualOverrideStatus, todayStr]);

  // Slots generated for this date (from 08:30 to 19:00)
  const slots = useMemo(() => {
    return getAvailableSlots(selectedDate);
  }, [selectedDate, getAvailableSlots, settings.manualOverrideStatus, settings.blockedSlotsByDate, settings.customUnlockedSlotsByDate, settings.workingDays]);

  // Metrics
  const totalSlotsCount = slots.length;
  const availableCount = slots.filter((s) => s.isAvailable).length;
  const blockedCount = slots.filter((s) => s.isBlockedByOwner).length;
  const lunchCount = slots.filter((s) => s.isLunchBreak).length;
  const bookedCount = slots.filter((s) => !s.isAvailable && s.appointment).length;

  // Batch actions
  const morningSlots = useMemo(() => {
    return slots
      .filter((s) => s.time >= '08:30' && s.time < '12:00' && !s.appointment)
      .map((s) => s.time);
  }, [slots]);

  const afternoonSlots = useMemo(() => {
    return slots
      .filter((s) => s.time >= '14:00' && s.time <= '19:00' && !s.appointment)
      .map((s) => s.time);
  }, [slots]);

  const handleBlockMorning = () => {
    if (morningSlots.length === 0) return;
    blockMultipleSlots(selectedDate, morningSlots);
  };

  const handleBlockAfternoon = () => {
    if (afternoonSlots.length === 0) return;
    blockMultipleSlots(selectedDate, afternoonSlots);
  };

  const handleUnblockAll = () => {
    unblockAllSlotsForDate(selectedDate);
  };

  const handleToggleLunchSlots = () => {
    const lunchTimes = ['12:00', '12:30', '13:00', '13:30'];
    const currentlyUnlocked = settings.customUnlockedSlotsByDate?.[selectedDate] || [];
    const hasAnyUnlocked = lunchTimes.some((t) => currentlyUnlocked.includes(t));

    lunchTimes.forEach((t) => {
      if (hasAnyUnlocked && currentlyUnlocked.includes(t)) {
        toggleLunchSlotUnlocked(selectedDate, t);
      } else if (!hasAnyUnlocked && !currentlyUnlocked.includes(t)) {
        toggleLunchSlotUnlocked(selectedDate, t);
      }
    });
  };

  const handleEnableDay = () => {
    if (selectedDateInfo.isToday) {
      setManualBarbershopStatus('open');
    } else {
      updateWorkingDay(selectedDateInfo.dayOfWeek, { active: true });
      showToast(`Expediente ativado com sucesso para este dia da semana!`, 'success');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
      {/* Title & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Painel de Controle do Barbeiro • Mariano
            </span>
          </div>
          <h3 className="text-xl font-bold font-brand text-zinc-100 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Gerenciador de Horários (Disponibilizar / Tirar da Agenda)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Clique em qualquer horário para <strong>Tirar da agenda</strong> ou <strong>Disponibilizar</strong> para os clientes. Os horários vão até às <strong>19:00</strong>.
          </p>
        </div>

        {/* Quick Date Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium">Data específica:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Date Carousel Chips */}
      <div>
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          1. Selecione o dia para gerenciar:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {quickDates.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[74px] p-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                  {d.weekday}
                </span>
                <span className="text-base font-bold font-brand my-0.5">
                  {d.dayNumber}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                  {d.isToday ? 'Hoje' : d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Status Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedDateInfo.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-xs uppercase font-bold text-zinc-300">
              {selectedDateInfo.fullFormatted}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {selectedDateInfo.isOpen ? (
              <span className="text-emerald-400 font-medium">
                ✓ Expediente aberto neste dia (08:30 às 19:00 • Almoço 12:00 às 14:00)
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ✕ Dia fechado ({selectedDateInfo.isSunday ? 'Norma da casa: Fechada aos domingos' : 'Descanso'})
              </span>
            )}
          </p>
        </div>

        {!selectedDateInfo.isOpen && (
          <button
            type="button"
            onClick={handleEnableDay}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10 shrink-0"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Ativar Expediente Para Esta Data</span>
          </button>
        )}
      </div>

      {/* Metrics Counters */}
      {selectedDateInfo.isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Slots</span>
            <span className="text-lg font-bold font-brand text-zinc-100">{totalSlotsCount}</span>
            <span className="text-[9px] text-zinc-500 block">08:30 às 19:00</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Disponíveis</span>
            <span className="text-lg font-bold font-brand text-emerald-400">{availableCount}</span>
            <span className="text-[9px] text-emerald-500/80 block">Livres p/ agendar</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Tirados pelo Dono</span>
            <span className="text-lg font-bold font-brand text-rose-400">{blockedCount}</span>
            <span className="text-[9px] text-rose-500/80 block">Indisponíveis</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Agendados</span>
            <span className="text-lg font-bold font-brand text-amber-400">{bookedCount}</span>
            <span className="text-[9px] text-amber-500/80 block">Com clientes</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 block">Almoço</span>
            <span className="text-lg font-bold font-brand text-orange-400">{lunchCount}</span>
            <span className="text-[9px] text-orange-500/80 block">12:00 às 14:00</span>
          </div>
        </div>
      )}

      {/* Quick Action Bulk Buttons */}
      {selectedDateInfo.isOpen && (
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            Ações Rápidas em Lote:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUnblockAll}
              className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              title="Restaura todos os horários como disponíveis"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liberar Todos os Horários</span>
            </button>

            <button
              type="button"
              onClick={handleBlockMorning}
              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
              title="Tira os horários da manhã (08:30 às 11:30)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Tirar Manhã (08:30 - 11:30)</span>
            </button>

            <button
              type="button"
              onClick={handleBlockAfternoon}
              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
              title="Tira os horários da tarde (14:00 às 19:00)"
            >
              <Sunset className="w-3.5 h-3.5 text-amber-400" />
              <span>Tirar Tarde (14:00 - 19:00)</span>
            </button>

            <button
              type="button"
              onClick={handleToggleLunchSlots}
              className="py-1.5 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30 flex items-center gap-1.5 transition-colors"
              title="Alterna horários de almoço (12:00 - 13:30) entre abertos e fechados"
            >
              <Coffee className="w-3.5 h-3.5 text-orange-400" />
              <span>Liberar / Bloquear Almoço</span>
            </button>
          </div>
        </div>
      )}

      {/* Slots Grid */}
      {selectedDateInfo.isOpen ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              2. Horários do Dia (08:30 até 19:00) — Toque no card para alternar:
            </label>
            <span className="text-[11px] text-zinc-500 font-medium">
              Horário de encerramento: <strong>19:00</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              // 1. Booked appointment
              if (!slot.isAvailable && slot.appointment) {
                const apt = slot.appointment;
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/40 relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-amber-400">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                          Agendado
                        </span>
                      </div>
                      <div className="mt-2 text-left">
                        <p className="text-xs font-bold text-zinc-200 truncate">
                          {apt.clientName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {apt.serviceName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminActiveTab('appointments')}
                      className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline text-left"
                    >
                      Ver na agenda →
                    </button>
                  </div>
                );
              }

              // 2. Lunch break
              if (slot.isLunchBreak) {
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-zinc-950 border border-orange-500/20 relative flex flex-col justify-between group hover:border-orange-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-orange-400/90">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 uppercase">
                          Almoço
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Pausa de almoço padrão da barbearia
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleLunchSlotUnlocked(selectedDate, slot.time)}
                      className="mt-3 w-full py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Liberar Almoço</span>
                    </button>
                  </div>
                );
              }

              // 3. Blocked / Removed by Owner
              if (slot.isBlockedByOwner) {
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/40 relative flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-rose-400 line-through">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                          Tirado
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-400/80 mt-2 font-medium">
                        Indisponível p/ clientes
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSlotBlocked(selectedDate, slot.time)}
                      className="mt-3 w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                      <span>Disponibilizar</span>
                    </button>
                  </div>
                );
              }

              // 4. Available Slot (Livre)
              return (
                <div
                  key={slot.time}
                  className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/30 relative flex flex-col justify-between group hover:border-emerald-500 transition-all shadow-sm shadow-emerald-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {slot.time}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                        Disponível
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      Livre para clientes agendarem
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSlotBlocked(selectedDate, slot.time)}
                    className="mt-3 w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 text-[11px] font-bold border border-zinc-800 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Tirar da Agenda</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400 space-y-3">
          <p className="font-semibold text-zinc-200">
            {selectedDateInfo.isSunday
              ? 'Domingo está fechado por norma da casa.'
              : 'Barbearia desativada nesta data.'}
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Para disponibilizar e tirar horários nesta data, ative o expediente usando o botão acima.
          </p>
          <button
            type="button"
            onClick={handleEnableDay}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
          >
            <Power className="w-4 h-4" />
            <span>Ativar Atendimento Nesta Data</span>
          </button>
        </div>
      )}

      {/* Owner Tip Footer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white block">Como funciona o controle de horários:</strong>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            • Quando você clica em <strong>"Tirar da Agenda"</strong>, aquele horário específico é marcado imediatamente como indisponível e nenhum cliente poderá agendá-lo.
            <br />
            • Para voltar a atender naquele horário, basta clicar em <strong>"Disponibilizar"</strong>.
            <br />
            • Os horários encerram rigorosamente no horário máximo configurado (padrão até às <strong>19:00</strong>).
          </p>
        </div>
      </div>
    </div>
  );
};
