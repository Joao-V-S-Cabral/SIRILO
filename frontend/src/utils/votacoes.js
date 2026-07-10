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

// `aberta_em` vem do backend como "AAAA-MM-DD HH:MM:SS" já no horário local
// do servidor (ver auditoria/votacoes.controller.js), então trocamos o
// espaço por "T" para o Date tratar como horário local, nunca UTC.
export function segundosRestantes(votacao) {
  if (!votacao?.aberta_em || !votacao?.duracao_minutos) return null;
  const abertaEmMs = new Date(votacao.aberta_em.replace(' ', 'T')).getTime();
  if (Number.isNaN(abertaEmMs)) return null;
  const restanteMs = abertaEmMs + votacao.duracao_minutos * 60 * 1000 - Date.now();
  return Math.max(0, Math.round(restanteMs / 1000));
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
