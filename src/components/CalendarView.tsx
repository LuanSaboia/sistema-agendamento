import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../types/agendamento';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Clock, Lock } from 'lucide-react'; 
import BookingModal from './BookingModal';

export default function CalendarView() {
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Agendamento | null>(null);
    const { user } = useAuth();

    const isMobile = window.innerWidth < 768;
    // Iniciamos com listMonth no mobile para ele ver o panorama geral do mês
    const [viewMode, setViewMode] = useState(isMobile ? 'listMonth' : 'dayGridMonth');

    useEffect(() => {
        const handleResize = () => setViewMode(window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { fetchAgendamentos(); }, [user]);

    async function fetchAgendamentos() {
        setLoading(true);
        const { data } = await supabase.from('agendamentos').select('*').order('data_hora', { ascending: true });
        
        if (data) {
            let listaFinal = data as Agendamento[];
            if (!user) {
                const ocupados = listaFinal.filter(a => a.status !== 'disponivel');
                listaFinal = listaFinal.filter(atual => {
                    if (atual.status !== 'disponivel') return true;
                    const dataAtual = new Date(atual.data_hora).getTime();
                    const temConflito = ocupados.some(ocupado => {
                        const dataOcupado = new Date(ocupado.data_hora).getTime();
                        return Math.abs(dataAtual - dataOcupado) / (1000 * 60) < 60;
                    });
                    return !temConflito;
                });
            }
            setAgendamentos(listaFinal);
        }
        setLoading(false);
    }

    const events = agendamentos.map(item => {
        const dataAgendamento = new Date(item.data_hora);
        return {
            id: item.id,
            start: item.data_hora,
            title: (user || item.status === 'disponivel') ? (item.cliente_nome || 'Disponível') : 'Reservado',
            backgroundColor: item.status === 'disponivel' ? '#dcfce7' : (item.status === 'pendente' ? '#fef3c7' : '#f1f5f9'),
            borderColor: 'transparent',
            extendedProps: { ...item, jaPassou: dataAgendamento < new Date() }
        };
    });

    const renderEventContent = (eventInfo: any) => {
        const { status, jaPassou, cliente_nome } = eventInfo.event.extendedProps;
        const horaManual = new Date(eventInfo.event.start).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        const horaExibir = eventInfo.timeText || horaManual;
        const isDisponivel = status === 'disponivel';

        return (
            <div className={`flex items-center gap-3 w-full transition-all ${jaPassou ? 'opacity-30 grayscale-[0.5]' : ''}`}>
                <div className={`p-2 rounded-xl shrink-0 ${isDisponivel ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {isDisponivel ? <Clock size={18} /> : <Lock size={18} />}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                    <div className="font-bold text-sm text-slate-900 truncate">
                        {user || isDisponivel ? (cliente_nome || 'Disponível') : 'Reservado'}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">{horaExibir}</div>
                </div>
            </div>
        );
    };

    const adicionarHorario = async (dateStr: string) => {
        if (!user) return;
        const hora = window.prompt("Hora (HH:mm):", "08:00");
        if (hora) {
            await supabase.from('agendamentos').insert([{ data_hora: `${dateStr}T${hora}:00`, status: 'disponivel', usuario_id: user.id }]);
            fetchAgendamentos();
        }
    };

    return (
        <div className="calendar-container relative bg-white">
            <style>{`
                .fc-list-event-title { padding: 6px 4px !important; }
                .fc-list-table { border-spacing: 0 2px !important; padding: 0 8px !important; }
                .fc-list-event { display: flex !important; align-items: center; border-bottom: 1px solid #f8fafc !important; cursor: pointer; }
                .fc-list-event-dot, .fc-list-event-time, .fc-list-event-graphic { display: none !important; }
                .fc-list-day-cushion { background-color: #f8fafc !important; padding: 8px 15px !important; cursor: ${user ? 'pointer' : 'default'} !important; }
                .fc-list-day-text { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                .fc .fc-toolbar { flex-direction: ${isMobile ? 'column' : 'row'}; gap: 12px; }
                .fc .fc-toolbar-title { font-size: 1.1rem !important; font-weight: 800; color: #1e293b; }
                
                /* Estilo dos botões para mobile não ficarem colados */
                .fc .fc-button-group { gap: 2px; }
                .fc .fc-button { 
                    background: #f1f5f9 !important; 
                    border: none !important; 
                    color: #475569 !important; 
                    font-size: 0.75rem !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    padding: 8px 12px !important;
                }
                .fc .fc-button-active { background: #3b82f6 !important; color: white !important; }
                .fc .fc-today-button { background: #3b82f6 !important; color: white !important; opacity: 1 !important; }
            `}</style>

            {loading ? (
                <div className="flex justify-center p-20 text-blue-600"><Loader2 className="animate-spin" size={40} /></div>
            ) : (
                <FullCalendar 
                    key={viewMode}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]} 
                    initialView={viewMode}
                    locale={ptBrLocale} 
                    events={events} 
                    height="auto"
                    eventContent={renderEventContent}
                    displayEventTime={true}
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: isMobile ? 'listMonth,listDay' : 'dayGridMonth,timeGridWeek'
                    }}
                    buttonText={{ 
                        today: 'Hoje', 
                        month: 'Mês', 
                        week: 'Semana', 
                        listMonth: 'Mês', // Nome amigável para o mobile
                        listDay: 'Dia'    // Nome amigável para o mobile
                    }}
                    dateClick={(info) => adicionarHorario(info.dateStr)}
                    eventClick={(info) => { 
                        const props = info.event.extendedProps;
                        if (!user && props.jaPassou) return;
                        if (user || props.status === 'disponivel') { 
                            setSelectedEvent(props as Agendamento); 
                            setIsModalOpen(true); 
                        } 
                    }}
                    navLinks={true}
                    navLinkDayClick={(date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        adicionarHorario(dateStr);
                    }}
                />
            )}

            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                selectedEvent={selectedEvent} 
                onConfirm={async (id, nome, contato, novaData) => {
                    const isAdminAjustando = user && selectedEvent?.status === 'disponivel';
                    const payload: any = { 
                        cliente_nome: isAdminAjustando ? null : nome, 
                        cliente_contato: isAdminAjustando ? null : contato, 
                        status: isAdminAjustando ? 'disponivel' : (user ? 'confirmado' : 'pendente')
                    };
                    if (novaData) payload.data_hora = novaData;
                    await supabase.from('agendamentos').update(payload).eq('id', id);
                    setIsModalOpen(false); 
                    fetchAgendamentos();
                    window.dispatchEvent(new Event('agendamentoAtualizado'));
                }} 
                onUpdateStatus={async (id, status) => {
                    const payload = status === 'cancelar' ? { status: 'disponivel', cliente_nome: null, cliente_contato: null } : { status };
                    await supabase.from('agendamentos').update(payload).eq('id', id);
                    setIsModalOpen(false); 
                    fetchAgendamentos();
                    window.dispatchEvent(new Event('agendamentoAtualizado'));
                }} 
            />
        </div>
    );
}