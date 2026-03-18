// src/components/CalendarView.tsx
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
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

    useEffect(() => { fetchAgendamentos(); }, [user]);

    async function fetchAgendamentos() {
        setLoading(true);
        const { data } = await supabase.from('agendamentos').select('*').order('data_hora', { ascending: true });
        if (data) setAgendamentos(data as Agendamento[]);
        setLoading(false);
    }

    const handleConfirmBooking = async (id: string, nome: string, contato: string, novaData?: string) => {
        const payload: any = { cliente_nome: nome, cliente_contato: contato, status: user ? 'confirmado' : 'pendente' };
        if (novaData) payload.data_hora = novaData;

        const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);
        if (!error) { 
            setIsModalOpen(false); 
            fetchAgendamentos();
            window.dispatchEvent(new Event('agendamentoAtualizado')); // Notifica o Dashboard
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        let payload: any = { status };
        if (status === 'cancelar') payload = { status: 'disponivel', cliente_nome: null, cliente_contato: null };

        const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);
        if (!error) { 
            setIsModalOpen(false); 
            fetchAgendamentos();
            window.dispatchEvent(new Event('agendamentoAtualizado'));
        }
    };

    const handleDateClick = async (info: any) => {
        if (!user) return;
        const hora = window.prompt(`Liberar horário para ${new Date(info.dateStr).toLocaleDateString()}? Hora (HH:mm):`, "08:00");
        if (hora) {
            await supabase.from('agendamentos').insert([{ data_hora: `${info.dateStr}T${hora}:00`, status: 'disponivel', usuario_id: user.id }]);
            fetchAgendamentos();
        }
    };

    const events = agendamentos.map(item => ({
        id: item.id, start: item.data_hora,
        title: (user || item.status === 'disponivel') ? (item.cliente_nome || '✅ Disponível') : '🔒 Reservado',
        backgroundColor: item.status === 'disponivel' ? '#22c55e' : (item.status === 'pendente' ? '#f59e0b' : '#64748b'),
        borderColor: 'transparent', extendedProps: item
    }));

    if (loading) return <div className="flex justify-center p-20 text-blue-600"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="calendar-container relative">
            <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" locale={ptBrLocale} events={events} height="auto"
                dateClick={handleDateClick}
                eventClick={(info) => { if (user || info.event.extendedProps.status === 'disponivel') { setSelectedEvent(info.event.extendedProps as Agendamento); setIsModalOpen(true); } }}
            />
            <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedEvent={selectedEvent} onConfirm={handleConfirmBooking} onUpdateStatus={handleUpdateStatus} />
        </div>
    );
}