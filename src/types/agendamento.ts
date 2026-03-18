export type AgendamentoStatus = 'disponivel' | 'pendente' | 'confirmado';

export interface Agendamento {
  id: string;
  data_hora: string;
  cliente_nome: string | null;
  cliente_contato: string | null;
  status: AgendamentoStatus;
  usuario_id: string;
}