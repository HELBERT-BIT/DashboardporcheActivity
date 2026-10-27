import React from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminSchedule } from './AdminSchedule';
import { AdminServices } from './AdminServices';
import { AdminHoursConfig } from './AdminHoursConfig';
import { AdminPayments } from './AdminPayments';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminCancellationsLog } from './AdminCancellationsLog';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scissors, 
  Clock, 
  DollarSign, 
  Megaphone, 
  ShieldAlert, 
  Sparkles,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { 
    adminActiveTab, 
    setAdminActiveTab, 
    simulateIncomingBooking, 
    appointments 
  } = useBarbershop();

  const delayedCount = appointments.filter((a) => a.status === 'cancelado_atraso').length;

  const tabs: {
    id: typeof adminActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'appointments',
      label: 'Agenda do Dia',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'services',
      label: 'Serviços & Preços',
      icon: <Scissors className="w-4 h-4" />,
    },
    {
      id: 'schedule',
      label: 'Horários & Expediente',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: 'Controle de Caixa',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: 'announcements',
      label: 'Mural de Avisos & Novidades',
      icon: <Megaphone className="w-4 h-4" />,
    },
    {
      id: 'cancellations',
      label: 'Cancelamentos & Atrasos',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: delayedCount > 0 ? delayedCount : undefined,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Navigation Pills */}
      <div className="flex border-b border-zinc-800 gap-1.5 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = adminActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-zinc-950 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Views */}
      {adminActiveTab === 'overview' && <AdminDashboard />}
      {adminActiveTab === 'appointments' && <AdminSchedule />}
      {adminActiveTab === 'services' && <AdminServices />}
      {adminActiveTab === 'schedule' && <AdminHoursConfig />}
      {adminActiveTab === 'payments' && <AdminPayments />}
      {adminActiveTab === 'announcements' && <AdminAnnouncements />}
      {adminActiveTab === 'cancellations' && <AdminCancellationsLog />}
    </div>
  );
};
