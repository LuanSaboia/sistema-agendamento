import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../types/agendamento';
import CalendarView from '../components/CalendarView';
import { CheckCircle, XCircle, LogOut, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { enviarZap } from '../lib/whatsapp';

export default function Dashboard() {
    const [pendentes, setPendentes] = useState<Agendamento[]>([]);
    const [stats, setStats] = useState({ total: 0, confirmados: 0 });
    const navigate = useNavigate();

    const fetchData = async () => {
        // Busca Pendentes
        const { data: dataPendentes } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('status', 'pendente')
            .order('data_hora', { ascending: true });
        
        if (dataPendentes) setPendentes(dataPendentes as Agendamento[]);

        // Busca Stats simples (Total do mês)
        const { count: total } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true });
        const { count: confirmados } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('status', 'confirmado');
        setStats({ total: total || 0, confirmados: confirmados || 0 });
    };

    useEffect(() => {
        fetchData();
        // Escuta atualizações vindas do componente CalendarView
        window.addEventListener('agendamentoAtualizado', fetchData);
        return () => window.removeEventListener('agendamentoAtualizado', fetchData);
    }, []);

    const atualizarStatus = async (id: string, novoStatus: string, item?: Agendamento) => {
        const payload: any = { status: novoStatus === 'cancelar' ? 'disponivel' : novoStatus };
        if (novoStatus === 'cancelar') { 
            payload.cliente_nome = null; 
            payload.cliente_contato = null; 
        }

        const { error } = await supabase.from('agendamentos').update(payload).eq('id', id);

        if (!error) {
            fetchData();
            if (novoStatus === 'confirmado' && item) {
                const dataF = new Date(item.data_hora).toLocaleDateString('pt-BR');
                const horaF = new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                enviarZap(item.cliente_contato!, item.cliente_nome!, dataF, horaF, 'confirmar');
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 px-4 py-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <Clock size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 hidden md:block">Painel Sincro</h1>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-semibold transition-colors">
                    <LogOut size={20} />
                    <span className="text-sm">Sair</span>
                </button>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna Esquerda: Calendário */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats rápidos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Geral</p>
                            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                        </div>
                        <div className="bg-blue-600 p-4 rounded-3xl shadow-blue-200 shadow-lg">
                            <p className="text-xs font-bold text-blue-100 uppercase mb-1">Confirmados</p>
                            <p className="text-2xl font-black text-white">{stats.confirmados}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <CalendarView />
                    </div>
                </div>

                {/* Coluna Direita: Pendentes */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Users size={20} className="text-blue-600" />
                            <h2 className="text-lg font-extrabold text-slate-900">Solicitações ({pendentes.length})</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {pendentes.map(item => (
                                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-slate-900">{item.cliente_nome}</p>
                                            <p className="text-xs font-medium text-slate-500">{item.cliente_contato}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-600 uppercase leading-none">
                                                {new Date(item.data_hora).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                            </p>
                                            <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                {new Date(item.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => atualizarStatus(item.id, 'confirmado', item)} 
                                            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl flex justify-center shadow-md shadow-green-100 active:scale-95 transition-all"
                                        >
                                            <CheckCircle size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => atualizarStatus(item.id, 'cancelar')} 
                                            className="flex-1 bg-white text-red-500 border border-slate-200 py-2.5 rounded-xl flex justify-center active:scale-95 transition-all"
                                        >
                                            <XCircle size={18}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendentes.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm">Nenhuma solicitação pendente</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}