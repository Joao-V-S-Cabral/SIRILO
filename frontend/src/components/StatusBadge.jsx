const CLASSES = {
  Agendada: 'badge badge-neutral',
  Em_Andamento: 'badge badge-info',
  Aguardando: 'badge badge-neutral',
  Aberta: 'badge badge-success',
  Encerrada: 'badge badge-muted',
};

const LABELS = {
  Em_Andamento: 'Em Andamento',
};

export function StatusBadge({ status }) {
  return <span className={CLASSES[status] || 'badge badge-neutral'}>{LABELS[status] || status}</span>;
}
