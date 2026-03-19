import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../types/agendamento';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import BookingModal from './BookingModal';

export default function CalendarView() {
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Agendamento | null>(null);
    const { user } = useAuth();

    const isMobile = window.innerWidth < 768;
    const [viewMode, setViewMode] = useState(isMobile ? 'listDay' : 'dayGridMonth');

    useEffect(() => {
        const handleResize = () => {
            setViewMode(window.innerWidth < 768 ? 'listDay' : 'dayGridMonth');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { fetchAgendamentos(); }, [user]);

    async function fetchAgendamentos() {
        setLoading(true);
        const { data } = await supabase.from('agendamentos').select('*').order('data_hora', { ascending: true });
        if (data) setAgendamentos(data as Agendamento[]);
        setLoading(false);
    }

    const events = agendamentos.map(item => ({
        id: item.id, 
        start: item.data_hora,
        title: (user || item.status === 'disponivel') ? (item.cliente_nome || '✅ Disponível') : '🔒 Reservado',
        backgroundColor: item.status === 'disponivel' ? '#22c55e' : (item.status === 'pendente' ? '#f59e0b' : '#94a3b8'),
        borderColor: 'transparent', 
        extendedProps: item,
        textColor: '#ffffff'
    }));

    if (loading) return <div className="flex justify-center p-20 text-blue-600"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="calendar-container relative bg-white">
            <style>{`
                .fc .fc-toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    justify-content: center;
                }
                @media (max-width: 768px) {
                    .fc .fc-toolbar-title { font-size: 1.1rem !important; }
                    .fc .fc-button { 
                        padding: 0.4rem 0.6rem !important; 
                        font-size: 0.85rem !important; 
                    }
                }
            `}</style>

            <FullCalendar 
                key={viewMode}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]} 
                initialView={viewMode}
                locale={ptBrLocale} 
                events={events} 
                height="auto"
                headerToolbar={{
                    
                    left: isMobile ? 'prev,next today' : 'prev,next today',
                    center: 'title',
                    right: isMobile ? '' : 'dayGridMonth,timeGridWeek'
                }}
                buttonText={{
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista'
                }}
                dateClick={async (info) => {
                    if (!user) return;
                    const hora = window.prompt(`Liberar horário para ${new Date(info.dateStr).toLocaleDateString()}? Hora (HH:mm):`, "08:00");
                    if (hora) {
                        await supabase.from('agendamentos').insert([{ data_hora: `${info.dateStr}T${hora}:00`, status: 'disponivel', usuario_id: user.id }]);
                        fetchAgendamentos();
                    }
                }}
                eventClick={(info) => { 
                    if (user || info.event.extendedProps.status === 'disponivel') { 
                        setSelectedEvent(info.event.extendedProps as Agendamento); 
                        setIsModalOpen(true); 
                    } 
                }}
            />
            
            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                selectedEvent={selectedEvent} 
                onConfirm={async (id, nome, contato, novaData) => {
                    const payload: any = { cliente_nome: nome, cliente_contato: contato, status: user ? 'confirmado' : 'pendente' };
                    if (novaData) payload.data_hora = novaData;
                    const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);
                    if (!error) { 
                        setIsModalOpen(false); 
                        fetchAgendamentos();
                        window.dispatchEvent(new Event('agendamentoAtualizado'));
                    }
                }} 
                onUpdateStatus={async (id, status) => {
                    let payload: any = { status };
                    if (status === 'cancelar') payload = { status: 'disponivel', cliente_nome: null, cliente_contato: null };
                    const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);
                    if (!error) { 
                        setIsModalOpen(false); 
                        fetchAgendamentos();
                        window.dispatchEvent(new Event('agendamentoAtualizado'));
                    }
                }} 
            />
        </div>
    );
}