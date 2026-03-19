import { useState, useEffect } from 'react';
import { X, Check, Trash2, CalendarClock, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { enviarZap } from '../lib/whatsapp';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedEvent: any;
    onConfirm: (id: string, nome: string, contato: string, novaData?: string) => Promise<void>;
    onUpdateStatus: (id: string, status: string) => Promise<void>;
}

// Função auxiliar para aplicar a máscara visual
const aplicarMascaraWhats = (valor: string) => {
    const numeros = valor.replace(/\D/g, ''); // Remove tudo que não é número
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
};

export default function BookingModal({ isOpen, onClose, selectedEvent, onConfirm, onUpdateStatus }: BookingModalProps) {
    const { user } = useAuth();
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState(''); // Aqui ficará sempre LIMPO (só números)
    const [isRemarcando, setIsRemarcando] = useState(false);
    const [novaData, setNovaData] = useState('');
    const [novaHora, setNovaHora] = useState('08:00');

    useEffect(() => {
        if (selectedEvent) {
            setNome(selectedEvent.cliente_nome || '');
            setContato(selectedEvent.cliente_contato || '');
            setIsRemarcando(false);
            setNovaData(selectedEvent.data_hora.split('T')[0]);
            setNovaHora(selectedEvent.data_hora.split('T')[1].substring(0, 5));
        }
    }, [selectedEvent]);

    if (!isOpen || !selectedEvent) return null;

    // Validação robusta para o botão
    const nomeValido = nome.trim().length >= 3;
    const contatoValido = contato.length >= 10; // Mínimo DDD + 8 ou 9 dígitos
    const jaPassou = new Date(selectedEvent.data_hora) < new Date();

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-slate-900">{user ? 'Gerenciar' : 'Agendar'}</h2>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>

                <div className="p-6 pt-2 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1.5 rounded-full">
                        <CalendarDays size={14} />
                        <span>{new Date(selectedEvent.data_hora).toLocaleDateString('pt-BR')} às {selectedEvent.data_hora.split('T')[1].substring(0, 5)}</span>
                    </div>

                    {!isRemarcando && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nome Completo</label>
                                <input 
                                    className="w-full bg-slate-50 border-none p-3 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 text-sm font-medium" 
                                    placeholder="Seu nome"
                                    value={nome} 
                                    onChange={e => setNome(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">WhatsApp</label>
                                <input 
                                    className="w-full bg-slate-50 border-none p-3 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 text-sm font-medium" 
                                    placeholder="(00) 00000-0000" 
                                    value={aplicarMascaraWhats(contato)} // Exibe com máscara
                                    onChange={e => setContato(e.target.value.replace(/\D/g, '').slice(0, 11))} // Salva só números (limite 11)
                                />
                            </div>
                        </div>
                    )}

                    {user ? (
                        /* ... (resto do código de admin permanece igual) ... */
                        <div className="pt-2 space-y-2">
                             {!isRemarcando ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => onUpdateStatus(selectedEvent.id, 'confirmado')} className="bg-green-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-green-100"><Check size={18}/> Confirmar</button>
                                        <button onClick={() => setIsRemarcando(true)} className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"><CalendarClock size={18}/> Remarcar</button>
                                    </div>
                                    <button onClick={() => onUpdateStatus(selectedEvent.id, 'cancelar')} className="w-full text-red-500 text-xs font-bold py-2 mt-2 underline">Excluir horário</button>
                                </>
                             ) : (
                                <div className="bg-slate-50 p-4 rounded-[1.5rem] space-y-3 border border-slate-100">
                                    <div className="flex gap-2 text-sm">
                                        <input type="date" className="flex-1 p-2 rounded-xl border-none font-bold" value={novaData} onChange={e => setNovaData(e.target.value)} />
                                        <input type="time" className="w-20 p-2 rounded-xl border-none font-bold" value={novaHora} onChange={e => setNovaHora(e.target.value)} />
                                    </div>
                                    <button onClick={() => onConfirm(selectedEvent.id, nome.trim(), contato, `${novaData}T${novaHora}:00`)} className="w-full bg-blue-600 text-white p-2.5 rounded-xl font-bold text-sm">Salvar Alteração</button>
                                    <button onClick={() => setIsRemarcando(false)} className="w-full text-slate-400 text-[10px] font-bold uppercase">Voltar</button>
                                </div>
                             )}
                        </div>
                    ) : (
                        <button 
                            disabled={jaPassou || !nomeValido || !contatoValido}
                            onClick={() => onConfirm(selectedEvent.id, nome.trim(), contato)} 
                            className={`w-full font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 ${
                                (jaPassou || !nomeValido || !contatoValido) 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            }`}
                        >
                            {jaPassou ? 'Horário Expirado' : 'Marcar Agora'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}