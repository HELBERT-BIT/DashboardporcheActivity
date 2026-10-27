import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  BarberService, 
  BarbershopSettings, 
  Appointment, 
  Announcement, 
  AdminNotification, 
  UserAccount, 
  PaymentMethod, 
  PaymentStatus, 
  AppointmentStatus,
  WorkingDayConfig,
  BarberReview
} from '../types';
import { 
  initialServices, 
  initialSettings, 
  initialAnnouncements, 
  initialAppointments, 
  initialNotifications,
  initialReviews,
  getTodayString 
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export interface SlotAvailability {
  time: string;
  isAvailable: boolean;
  appointment?: Appointment;
  isLunchBreak?: boolean;
  isBlockedByOwner?: boolean;
  isPast?: boolean;
}

interface BarbershopContextType {
  // State
  services: BarberService[];
  settings: BarbershopSettings;
  appointments: Appointment[];
  announcements: Announcement[];
  notifications: AdminNotification[];
  reviews: BarberReview[];
  currentUser: UserAccount | null;
  activeView: 'client' | 'admin';
  clientActiveTab: 'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber';
  adminActiveTab: 'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations';
  toasts: ToastMessage[];

  // Navigation & View Mode
  setActiveView: (view: 'client' | 'admin') => void;
  setClientActiveTab: (tab: 'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber') => void;
  setAdminActiveTab: (tab: 'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations') => void;
  
  // Toasts
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;

  // Reviews & Barber Rating
  addReview: (review: Omit<BarberReview, 'id' | 'createdAt'>) => void;
  getBarberRatingStats: () => {
    average: number;
    count: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };

  // Barbershop Status & Owner Manual Toggle
  isOpenNow: () => { 
    isOpen: boolean; 
    message: string; 
    todayConfig?: WorkingDayConfig;
    isManualOverride?: boolean;
    manualStatus?: 'open' | 'closed' | 'auto';
  };
  setManualBarbershopStatus: (status: 'open' | 'closed' | 'auto') => void;
  getAvailableSlots: (dateString: string) => SlotAvailability[];

  // Owner Slot Customization (Disponibilizar / Tirar Horários)
  toggleSlotBlocked: (dateString: string, timeSlot: string) => void;
  blockMultipleSlots: (dateString: string, slots: string[]) => void;
  unblockAllSlotsForDate: (dateString: string) => void;
  toggleLunchSlotUnlocked: (dateString: string, timeSlot: string) => void;
  isSlotBlockedByOwner: (dateString: string, timeSlot: string) => boolean;
  isSlotLunchUnlocked: (dateString: string, timeSlot: string) => boolean;

  // Appointments
  createAppointment: (params: {
    serviceId: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    date: string;
    time: string;
    paymentType: 'antecipado' | 'presencial';
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Appointment | null;

  cancelAppointment: (id: string, reason: string, isFromAdmin?: boolean) => void;
  simulateDelayAndCancel: (id: string) => void;
  checkInAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  registerPayment: (id: string, method: PaymentMethod, status: PaymentStatus) => void;

  // Services Management
  addService: (service: Omit<BarberService, 'id'>) => void;
  updateService: (id: string, service: Partial<BarberService>) => void;
  deleteService: (id: string) => void;

  // Settings & Working Hours
  updateSettings: (newSettings: Partial<BarbershopSettings>) => void;
  updateWorkingDay: (dayOfWeek: number, config: Partial<WorkingDayConfig>) => void;

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Auth Simulation
  loginClient: (phoneOrEmail: string, name: string) => void;
  logoutClient: () => void;

  // Demo Helpers
  resetToDefaults: () => void;
  simulateIncomingBooking: () => void;
}

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

// Updated storage key version to instantly migrate to Estúdio VIP Barbearia with images
const STORAGE_KEYS = {
  SERVICES: 'estudiovip_services_v5',
  SETTINGS: 'estudiovip_settings_v5',
  APPOINTMENTS: 'estudiovip_appointments_v5',
  ANNOUNCEMENTS: 'estudiovip_announcements_v5',
  NOTIFICATIONS: 'estudiovip_notifications_v5',
  USER: 'estudiovip_user_v5',
  REVIEWS: 'estudiovip_reviews_v5',
};

export const BarbershopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to defaults
  const [services, setServices] = useState<BarberService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (saved) {
        const parsed: BarberService[] = JSON.parse(saved);
        return parsed.map((svc) => {
          const init = initialServices.find((s) => s.id === svc.id);
          if (init && !svc.imageUrl) {
            return { ...svc, imageUrl: init.imageUrl };
          }
          return svc;
        });
      }
      return initialServices;
    } catch {
      return initialServices;
    }
  });

  const [reviews, setReviews] = useState<BarberReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : initialReviews;
    } catch {
      return initialReviews;
    }
  });

  const [settings, setSettings] = useState<BarbershopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed: BarbershopSettings = JSON.parse(saved);
        if (parsed.workingDays) {
          parsed.workingDays = parsed.workingDays.map((wd: WorkingDayConfig) => {
            if (wd.dayOfWeek === 0) {
              return { 
                ...wd, 
                // Sunday is closed automatically by default as house policy (norma da casa)
                active: parsed.manualOverrideStatus === 'open' ? true : false,
                openTime: wd.openTime || '08:30', 
                closeTime: wd.closeTime && wd.closeTime > '13:00' ? wd.closeTime : '19:00', 
                hasLunchBreak: true, 
                lunchStart: wd.lunchStart || '12:00', 
                lunchEnd: wd.lunchEnd || '14:00' 
              };
            }
            return wd;
          });
        }
        return parsed;
      }
      return initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : initialAppointments;
    } catch {
      return initialAppointments;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return saved ? JSON.parse(saved) : initialAnnouncements;
    } catch {
      return initialAnnouncements;
    }
  });

  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : {
        id: 'usr-default',
        name: 'Rafael Oliveira',
        phone: '(67) 99876-1122',
        email: 'rafael.oliveira@gmail.com',
        isLoggedIn: true
      };
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [clientActiveTab, setClientActiveTab] = useState<'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber'>('booking');
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations'>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error(e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.error(e);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.error(e);
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Toast helper
  const showToast = (message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Owner manual toggle for Open / Closed
  const setManualBarbershopStatus = (status: 'open' | 'closed' | 'auto') => {
    setSettings((prev) => {
      // When resetting to auto mode, ensure Sunday reverts to closed automatically by default (norma da casa)
      let updatedWorkingDays = prev.workingDays;
      if (status === 'auto') {
        updatedWorkingDays = prev.workingDays.map((wd) => {
          if (wd.dayOfWeek === 0) {
            return { ...wd, active: false };
          }
          return wd;
        });
      }
      return {
        ...prev,
        manualOverrideStatus: status,
        workingDays: updatedWorkingDays,
      };
    });

    if (status === 'open') {
      showToast('Barbearia ativada como ABERTA pelo proprietário! Horários de hoje disponíveis para agendamento.', 'success', 'Expediente Aberto');
    } else if (status === 'closed') {
      showToast('Barbearia desativada como FECHADA pelo proprietário!', 'warning', 'Expediente Fechado');
    } else {
      showToast('Barbearia voltou para o modo AUTOMÁTICO de expediente (domingo fechado por norma da casa).', 'info', 'Status Automático');
    }
  };

  // Barbershop Status check with manual owner override
  const isOpenNow = () => {
    const override = settings.manualOverrideStatus;

    if (override === 'open') {
      return {
        isOpen: true,
        message: 'Aberto agora (Confirmado pelo barbeiro)',
        isManualOverride: true,
        manualStatus: 'open' as const,
      };
    }

    if (override === 'closed') {
      return {
        isOpen: false,
        message: 'Fechado no momento pelo proprietário',
        isManualOverride: true,
        manualStatus: 'closed' as const,
      };
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const todayConfig = settings.workingDays.find((d) => d.dayOfWeek === currentDayOfWeek);

    // House rule: Sunday (dayOfWeek === 0) is closed automatically by default
    if (currentDayOfWeek === 0 || !todayConfig || !todayConfig.active) {
      return { 
        isOpen: false, 
        message: currentDayOfWeek === 0 ? 'Fechado hoje (Descanso semanal - Norma da casa)' : 'Fechado hoje (Descanso semanal)', 
        todayConfig,
        manualStatus: 'auto' as const
      };
    }

    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentHourMin < todayConfig.openTime) {
      return { 
        isOpen: false, 
        message: `Fechado. Abre hoje às ${todayConfig.openTime}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    if (todayConfig.hasLunchBreak && currentHourMin >= todayConfig.lunchStart && currentHourMin < todayConfig.lunchEnd) {
      return { 
        isOpen: false, 
        message: `Em intervalo de almoço até ${todayConfig.lunchEnd}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    if (currentHourMin >= todayConfig.closeTime) {
      return { 
        isOpen: false, 
        message: `Fechado por hoje. Aberto até às ${todayConfig.closeTime}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    return { 
      isOpen: true, 
      message: `Aberto hoje até às ${todayConfig.closeTime}`, 
      todayConfig,
      manualStatus: 'auto' as const 
    };
  };

  // Helper to convert HH:mm to minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (mins || 0);
  };

  // Helper to convert minutes to HH:mm string
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Helper to add minutes to HH:mm string
  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Slot customization by owner (Disponibilizar / Tirar Horários)
  const isSlotBlockedByOwner = (dateString: string, timeSlot: string): boolean => {
    return (settings.blockedSlotsByDate?.[dateString] || []).includes(timeSlot);
  };

  const isSlotLunchUnlocked = (dateString: string, timeSlot: string): boolean => {
    return (settings.customUnlockedSlotsByDate?.[dateString] || []).includes(timeSlot);
  };

  const toggleSlotBlocked = (dateString: string, timeSlot: string) => {
    const currentlyBlocked = settings.blockedSlotsByDate?.[dateString] || [];
    const isAlreadyBlocked = currentlyBlocked.includes(timeSlot);
    const updated = isAlreadyBlocked
      ? currentlyBlocked.filter((s) => s !== timeSlot)
      : [...currentlyBlocked, timeSlot];

    setSettings((prev) => ({
      ...prev,
      blockedSlotsByDate: {
        ...(prev.blockedSlotsByDate || {}),
        [dateString]: updated,
      },
    }));

    if (isAlreadyBlocked) {
      showToast(`Horário das ${timeSlot} disponibilizado para agendamento!`, 'success', 'Horário Liberado');
    } else {
      showToast(`Horário das ${timeSlot} retirado da agenda pelo proprietário.`, 'warning', 'Horário Tirado da Agenda');
    }
  };

  const blockMultipleSlots = (dateString: string, slotsToBlock: string[]) => {
    setSettings((prev) => {
      const currentBlocked = prev.blockedSlotsByDate?.[dateString] || [];
      const merged = Array.from(new Set([...currentBlocked, ...slotsToBlock]));
      return {
        ...prev,
        blockedSlotsByDate: {
          ...(prev.blockedSlotsByDate || {}),
          [dateString]: merged,
        },
      };
    });
    showToast(`${slotsToBlock.length} horários foram retirados da agenda.`, 'warning', 'Horários Bloqueados');
  };

  const unblockAllSlotsForDate = (dateString: string) => {
    setSettings((prev) => {
      const nextMap = { ...(prev.blockedSlotsByDate || {}) };
      delete nextMap[dateString];
      return {
        ...prev,
        blockedSlotsByDate: nextMap,
      };
    });
    showToast('Todos os horários desta data foram disponibilizados para os clientes!', 'success', 'Agenda Totalmente Liberada');
  };

  const toggleLunchSlotUnlocked = (dateString: string, timeSlot: string) => {
    const currentlyUnlocked = settings.customUnlockedSlotsByDate?.[dateString] || [];
    const isUnlocked = currentlyUnlocked.includes(timeSlot);
    const updated = isUnlocked
      ? currentlyUnlocked.filter((s) => s !== timeSlot)
      : [...currentlyUnlocked, timeSlot];

    setSettings((prev) => ({
      ...prev,
      customUnlockedSlotsByDate: {
        ...(prev.customUnlockedSlotsByDate || {}),
        [dateString]: updated,
      },
    }));

    if (isUnlocked) {
      showToast(`Horário das ${timeSlot} voltou ao intervalo de almoço fechado.`, 'info');
    } else {
      showToast(`Horário das ${timeSlot} liberado para atendimento no almoço!`, 'success', 'Almoço Aberto');
    }
  };

  // Generate available slots for a given date string (YYYY-MM-DD)
  // Ensures hours start at 08:30 and run through 19:00 (inclusive)
  const getAvailableSlots = (dateString: string): SlotAvailability[] => {
    // Parse target date to get day of week
    const [year, month, day] = dateString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const todayStr = getTodayString();
    const isTargetToday = dateString === todayStr;
    const isManuallyOpenToday = isTargetToday && settings.manualOverrideStatus === 'open';
    const isManuallyClosedToday = isTargetToday && settings.manualOverrideStatus === 'closed';

    // If owner explicitly closed today via manual toggle, no slots available today
    if (isManuallyClosedToday) {
      return [];
    }

    const dayConfig = settings.workingDays.find((d) => d.dayOfWeek === dayOfWeek);

    // Rule: Sunday (dayOfWeek === 0) is closed automatically by default unless owner activated today or enabled in working days
    if (!isManuallyOpenToday) {
      if (!dayConfig || !dayConfig.active) {
        return [];
      }
    }

    // Determine operating hours for this date strictly based on the owner's configuration
    // Default standard for all days: 08:30 to 19:00 (Lunch: 12:00 to 14:00)
    // If the owner modifies opening or closing times (earlier or later), the agenda adapts faithfully
    const openTime = dayConfig?.openTime || '08:30';
    const closeTime = dayConfig?.closeTime || '19:00';
    const hasLunchBreak = dayConfig !== undefined ? dayConfig.hasLunchBreak : true;
    const lunchStart = dayConfig?.lunchStart || '12:00';
    const lunchEnd = dayConfig?.lunchEnd || '14:00';

    const slots: SlotAvailability[] = [];
    const interval = settings.slotDurationMinutes || 30;

    const blockedList = settings.blockedSlotsByDate?.[dateString] || [];
    const unlockedLunchList = settings.customUnlockedSlotsByDate?.[dateString] || [];

    // Active booked appointments on this date
    const activeAppointmentsOnDate = appointments.filter((apt) => {
      return (
        apt.date === dateString &&
        ['agendado', 'confirmado_presenca', 'em_atendimento', 'concluido'].includes(apt.status)
      );
    });

    const startMinutes = timeToMinutes(openTime);
    const endMinutes = timeToMinutes(closeTime);
    const lunchStartMin = timeToMinutes(lunchStart);
    const lunchEndMin = timeToMinutes(lunchEnd);

    // Loop through minutes up to and including endMinutes so 19:00 is generated faithfully
    for (let m = startMinutes; m <= endMinutes; m += interval) {
      const currentSlot = minutesToTime(m);
      const isBlockedByOwner = blockedList.includes(currentSlot);
      const isLunchTime = hasLunchBreak && m >= lunchStartMin && m < lunchEndMin;
      const isLunchUnlocked = unlockedLunchList.includes(currentSlot);
      const isLunch = isLunchTime && !isLunchUnlocked;

      if (isLunch) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: true,
          isBlockedByOwner: false,
        });
      } else if (isBlockedByOwner) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: false,
          isBlockedByOwner: true,
        });
      } else {
        const occupyingApt = activeAppointmentsOnDate.find((apt) => apt.time === currentSlot);

        slots.push({
          time: currentSlot,
          isAvailable: !occupyingApt,
          appointment: occupyingApt,
          isLunchBreak: false,
          isBlockedByOwner: false,
        });
      }
    }

    return slots;
  };

  // Create Appointment
  const createAppointment = ({
    serviceId,
    clientName,
    clientPhone,
    clientEmail,
    date,
    time,
    paymentType,
    paymentMethod,
    notes,
  }: {
    serviceId: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    date: string;
    time: string;
    paymentType: 'antecipado' | 'presencial';
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Appointment | null => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      showToast('Serviço não encontrado.', 'error');
      return null;
    }

    // Double check if slot was removed from agenda by the owner
    const isBlocked = (settings.blockedSlotsByDate?.[date] || []).includes(time);
    if (isBlocked) {
      showToast(`O horário das ${time} foi retirado da agenda pelo barbeiro. Por favor, escolha outro horário livre.`, 'error', 'Horário Indisponível');
      return null;
    }

    // Double check availability to prevent simultaneous bookings
    const isOccupied = appointments.some(
      (apt) =>
        apt.date === date &&
        apt.time === time &&
        ['agendado', 'confirmado_presenca', 'em_atendimento', 'concluido'].includes(apt.status)
    );

    if (isOccupied) {
      showToast(`O horário das ${time} acabou de ser reservado. Por favor, escolha outro horário.`, 'error', 'Horário Indisponível');
      return null;
    }

    const toleranceExpiry = addMinutesToTime(time, settings.toleranceMinutes || 10);
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes,
      date,
      time,
      toleranceExpiryTime: toleranceExpiry,
      paymentType,
      paymentMethod,
      paymentStatus: paymentType === 'antecipado' ? 'pago' : 'pendente',
      status: 'agendado',
      createdAt: new Date().toISOString(),
      notes,
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Push simulated notification to owner
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: '💈 Novo Agendamento Confirmado!',
      message: `${clientName} agendou ${service.name} para ${date} às ${time} (${paymentType === 'antecipado' ? 'Pago via Pix' : 'Pagamento Presencial'}).`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'novo_agendamento',
      appointmentId: newAppointment.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(
      `Agendamento para ${time} confirmado! Lembre-se: tolerância de 10 minutos.`,
      'success',
      'Reserva Confirmada!'
    );

    return newAppointment;
  };

  // Cancel Appointment
  const cancelAppointment = (id: string, reason: string, isFromAdmin = false) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const status: AppointmentStatus = isFromAdmin ? 'cancelado_barbearia' : 'cancelado_cliente';
          return {
            ...apt,
            status,
            cancellationReason: reason,
            cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return apt;
      })
    );

    const cancelledApt = appointments.find((a) => a.id === id);
    if (cancelledApt) {
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        title: 'Cancelamento de Horário',
        message: `O agendamento de ${cancelledApt.clientName} (${cancelledApt.time}) foi cancelado. Horário liberado na agenda.`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'cancelamento_cliente',
        appointmentId: id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    showToast('Agendamento cancelado com sucesso. O horário foi liberado na agenda.', 'info', 'Cancelamento Efetuado');
  };

  // Simulate Delay Exceeded and Auto-Cancel
  const simulateDelayAndCancel = (id: string) => {
    let affectedApt: Appointment | undefined;

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          affectedApt = apt;
          return {
            ...apt,
            status: 'cancelado_atraso',
            cancellationReason: `Cancelamento automático: tolerância de ${settings.toleranceMinutes} minutos ultrapassada sem comparecimento do cliente.`,
            cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return apt;
      })
    );

    if (affectedApt) {
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        title: '⚠️ Cancelamento Automático por Atraso',
        message: `O cliente ${affectedApt.clientName} não compareceu dentro da tolerância de 10 min das ${affectedApt.time}. Horário liberado para outros clientes!`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'cancelamento_atraso',
        appointmentId: id,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      showToast(
        `Agendamento de ${affectedApt.clientName} cancelado por tolerância de 10 min excedida. Horário das ${affectedApt.time} liberado!`,
        'warning',
        'Tolerância Ultrapassada'
      );
    }
  };

  // Client Check-in confirmation
  const checkInAppointment = (id: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'confirmado_presenca',
              checkedInAt: timeNow,
            }
          : apt
      )
    );
    showToast('Presença do cliente confirmada no balcão!', 'success', 'Check-in Realizado');
  };

  // Complete Appointment
  const completeAppointment = (id: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'concluido',
              paymentStatus: 'pago',
              completedAt: timeNow,
            }
          : apt
      )
    );
    showToast('Atendimento finalizado com sucesso!', 'success', 'Concluído');
  };

  // Register payment
  const registerPayment = (id: string, method: PaymentMethod, status: PaymentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              paymentMethod: method,
              paymentStatus: status,
            }
          : apt
      )
    );
    showToast('Pagamento registrado com sucesso!', 'success', 'Financeiro Atualizado');
  };

  // Services actions
  const addService = (newServiceData: Omit<BarberService, 'id'>) => {
    const newService: BarberService = {
      ...newServiceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
    showToast(`Serviço "${newService.name}" adicionado com sucesso!`, 'success');
  };

  const updateService = (id: string, updatedFields: Partial<BarberService>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
    );
    showToast('Serviço atualizado!', 'success');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Serviço removido.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<BarbershopSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Configurações da barbearia atualizadas!', 'success');
  };

  const updateWorkingDay = (dayOfWeek: number, config: Partial<WorkingDayConfig>) => {
    setSettings((prev) => ({
      ...prev,
      workingDays: prev.workingDays.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, ...config } : d
      ),
    }));
    showToast('Horário de funcionamento atualizado!', 'success');
  };

  // Announcements
  const addAnnouncement = (newAnn: Omit<Announcement, 'id'>) => {
    const ann: Announcement = {
      ...newAnn,
      id: `anc-${Date.now()}`,
    };
    setAnnouncements((prev) => [ann, ...prev]);
    showToast('Novo comunicado publicado no Mural de Avisos!', 'success');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('Aviso removido.', 'info');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Auth Simulation
  const loginClient = (phoneOrEmail: string, name: string) => {
    const isEmail = phoneOrEmail.includes('@');
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name.trim() || 'Cliente Estúdio VIP',
      phone: !isEmail ? phoneOrEmail : '(67) 99876-4321',
      email: isEmail ? phoneOrEmail : 'cliente@exemplo.com',
      isLoggedIn: true,
    };
    setCurrentUser(newUser);
    showToast(`Bem-vindo, ${newUser.name}!`, 'success', 'Login Realizado');
  };

  const logoutClient = () => {
    setCurrentUser(null);
    showToast('Você saiu da sua conta.', 'info');
  };

  // Reviews & Barber Rating
  const addReview = (newReviewData: Omit<BarberReview, 'id' | 'createdAt'>) => {
    const newReview: BarberReview = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);

    // Send admin notification
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: `Nova Avaliação: ${newReview.rating} Estrelas ⭐`,
      message: `${newReview.clientName} avaliou o serviço ${newReview.serviceName}: "${newReview.comment.substring(0, 60)}..."`,
      timestamp: 'Agora',
      read: false,
      type: 'novo_agendamento',
      appointmentId: newReview.appointmentId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast('Sua avaliação foi enviada com sucesso! Muito obrigado pelo feedback.', 'success', 'Avaliação Registrada');
  };

  const getBarberRatingStats = () => {
    if (reviews.length === 0) {
      return {
        average: 5.0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
    });
    return {
      average: avg,
      count: reviews.length,
      distribution
    };
  };

  // Demo Helpers
  const resetToDefaults = () => {
    setServices(initialServices);
    setSettings(initialSettings);
    setAppointments(initialAppointments);
    setAnnouncements(initialAnnouncements);
    setNotifications(initialNotifications);
    setReviews(initialReviews);
    localStorage.clear();
    showToast('Dados restaurados para o padrão do Estúdio VIP Barbearia!', 'info', 'Reset Completo');
  };

  const simulateIncomingBooking = () => {
    const randomNames = ['Guilherme Arantes', 'Bruno Guimarães', 'Renato Castilho', 'Carlos Eduardo'];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const chosenService = services[Math.floor(Math.random() * services.length)];
    const availableSlots = getAvailableSlots(getTodayString()).filter((s) => s.isAvailable);

    if (availableSlots.length === 0) {
      showToast('Agenda de hoje já está cheia para simulação!', 'warning');
      return;
    }

    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    createAppointment({
      serviceId: chosenService.id,
      clientName: chosenName,
      clientPhone: '(67) 9' + Math.floor(10000000 + Math.random() * 90000000),
      clientEmail: `${chosenName.toLowerCase().replace(' ', '.')}@email.com`,
      date: getTodayString(),
      time: randomSlot.time,
      paymentType: Math.random() > 0.5 ? 'antecipado' : 'presencial',
      paymentMethod: 'pix',
      notes: 'Simulação gerada para teste em tempo real',
    });
  };

  return (
    <BarbershopContext.Provider
      value={{
        services,
        settings,
        appointments,
        announcements,
        notifications,
        reviews,
        currentUser,
        activeView,
        clientActiveTab,
        adminActiveTab,
        toasts,
        setActiveView,
        setClientActiveTab,
        setAdminActiveTab,
        showToast,
        removeToast,
        isOpenNow,
        setManualBarbershopStatus,
        getAvailableSlots,
        toggleSlotBlocked,
        blockMultipleSlots,
        unblockAllSlotsForDate,
        toggleLunchSlotUnlocked,
        isSlotBlockedByOwner,
        isSlotLunchUnlocked,
        createAppointment,
        cancelAppointment,
        simulateDelayAndCancel,
        checkInAppointment,
        completeAppointment,
        registerPayment,
        addService,
        updateService,
        deleteService,
        updateSettings,
        updateWorkingDay,
        addAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        loginClient,
        logoutClient,
        resetToDefaults,
        simulateIncomingBooking,
        addReview,
        getBarberRatingStats,
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
};

export const useBarbershop = (): BarbershopContextType => {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershop must be used within a BarbershopProvider');
  }
  return context;
};
