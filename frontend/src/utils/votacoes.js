export function parseOpcoes(opcoes) {
  if (Array.isArray(opcoes)) return opcoes;
  if (typeof opcoes === 'string') {
    try {
      const parsed = JSON.parse(opcoes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function formatarDataHora(data, hora) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
}

export const STATUS_REUNIAO_LABEL = {
  Agendada: 'Agendada',
  Em_Andamento: 'Em Andamento',
  Encerrada: 'Encerrada',
};

export const STATUS_VOTACAO_LABEL = {
  Aguardando: 'Aguardando',
  Aberta: 'Aberta',
  Encerrada: 'Encerrada',
};
