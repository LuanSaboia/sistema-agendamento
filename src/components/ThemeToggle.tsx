import { useState, useEffect } from 'react';
import { X, CalendarDays, Check, Trash2, CalendarClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedEvent: any;
    onConfirm: (id: string, nome: string, contato: string, novaData?: string) => Promise<void>;
    onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export default function BookingModal({ isOpen, onClose, selectedEvent, onConfirm, onUpdateStatus }: BookingModalProps) {
    const { user } = useAuth();
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');
    const [isRemarcando, setIsRemarcando] = useState(false);
    const [novaData, setNovaData] = useState('');
    const [novaHora, setNovaHora] = useState('08:00');

    useEffect(() => {
        if (selectedEvent) {
            setNome(selectedEvent.cliente_nome || '');
            setContato(selectedEvent.cliente_contato || '');
            setIsRemarcando(false);
            setNovaData(selectedEvent.data_hora.split('T')[0]);
        }
    }, [selectedEvent]);

    if (!isOpen || !selectedEvent) return null;

    const jaPassou = new Date(selectedEvent.data_hora) < new Date();
    const dataF = new Date(selectedEvent.data_hora).toLocaleDateString('pt-BR');
    const horaF = new Date(selectedEvent.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">{user ? 'Gerenciar' : 'Agendar'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700">
                        <CalendarDays size={18} />
                        <span>{dataF} às {horaF}</span>
                    </div>

                    {!isRemarcando && (
                        <div className="space-y-3">
                            <input placeholder="Seu Nome" className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-blue-500" value={nome} onChange={e => setNome(e.target.value)} />
                            <input placeholder="WhatsApp" className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-blue-500" value={contato} onChange={e => setContato(e.target.value)} />
                        </div>
                    )}

                    {user ? (
                        <div className="pt-4 border-t space-y-2">
                            {!isRemarcando ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => onUpdateStatus(selectedEvent.id, 'confirmado')} className="bg-green-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold"><Check size={18}/> Confirmar</button>
                                    <button onClick={() => setIsRemarcando(true)} className="border border-orange-200 text-orange-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold"><CalendarClock size={18}/> Remarcar</button>
                                    <button onClick={() => onUpdateStatus(selectedEvent.id, 'cancelar')} className="col-span-2 border text-red-500 p-3 rounded-xl flex items-center justify-center gap-2"><Trash2 size={18}/> Excluir Agendamento</button>
                                </div>
                            ) : (
                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3">
                                    <div className="flex gap-2">
                                        <input type="date" className="flex-1 p-2 rounded-lg border" value={novaData} onChange={e => setNovaData(e.target.value)} />
                                        <input type="time" className="w-24 p-2 rounded-lg border" value={novaHora} onChange={e => setNovaHora(e.target.value)} />
                                    </div>
                                    <button onClick={() => onConfirm(selectedEvent.id, nome, contato, `${novaData}T${novaHora}:00`)} className="w-full bg-orange-600 text-white p-2 rounded-lg font-bold">Salvar Alteração</button>
                                    <button onClick={() => setIsRemarcando(false)} className="w-full text-slate-500 text-sm py-1">Voltar</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button 
                            disabled={jaPassou || !nome || !contato}
                            onClick={() => onConfirm(selectedEvent.id, nome, contato)} 
                            className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all ${jaPassou ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {jaPassou ? 'Horário Expirado' : 'Confirmar Agendamento'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}