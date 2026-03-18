import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../types/agendamento';
import CalendarView from '../components/CalendarView';
import { CheckCircle, XCircle, LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { enviarZap } from '../lib/whatsapp';

export default function Dashboard() {
    const [pendentes, setPendentes] = useState<Agendamento[]>([]);
    const navigate = useNavigate();

    const fetchPendentes = async () => {
        const { data } = await supabase.from('agendamentos').select('*').eq('status', 'pendente').order('data_hora', { ascending: true });
        if (data) setPendentes(data as Agendamento[]);
    };

    useEffect(() => {
        fetchPendentes();
        window.addEventListener('agendamentoAtualizado', fetchPendentes);
        return () => window.removeEventListener('agendamentoAtualizado', fetchPendentes);
    }, []);

    const atualizarStatus = async (id: string, novoStatus: string, item?: Agendamento) => {
        const payload: any = { status: novoStatus === 'cancelar' ? 'disponivel' : novoStatus };
        if (novoStatus === 'cancelar') { payload.cliente_nome = null; payload.cliente_contato = null; }

        const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);
        if (!error) {
            fetchPendentes();
            if (novoStatus === 'confirmado' && item) {
                const d = new Date(item.data_hora);
                enviarZap(item.cliente_contato!, item.cliente_nome!, d.toLocaleDateString('pt-BR'), d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 'confirmar');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b p-4 flex justify-between items-center px-8 shadow-sm">
                <h1 className="text-xl font-bold flex items-center gap-2"><Clock className="text-blue-600" /> Painel Admin</h1>
                <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="text-slate-500 hover:text-red-600 flex items-center gap-1"><LogOut size={18}/> Sair</button>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border"><CalendarView /></div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border">
                    <h2 className="text-lg font-bold mb-4">Aguardando Aprovação ({pendentes.length})</h2>
                    <div className="space-y-3">
                        {pendentes.map(item => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between font-bold text-slate-900 mb-1"><span>{item.cliente_nome}</span><span className="text-[10px] text-slate-400">{new Date(item.data_hora).toLocaleDateString()}</span></div>
                                <p className="text-sm text-slate-500 mb-4">{item.cliente_contato}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => atualizarStatus(item.id, 'confirmado', item)} className="flex-1 bg-green-600 text-white p-2 rounded-xl flex justify-center"><CheckCircle size={18}/></button>
                                    <button onClick={() => atualizarStatus(item.id, 'cancelar')} className="flex-1 bg-white text-red-600 border border-slate-200 p-2 rounded-xl flex justify-center"><XCircle size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {pendentes.length === 0 && <p className="text-center text-slate-400 text-sm py-10">Tudo em dia!</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}