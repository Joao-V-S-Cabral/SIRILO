import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { atualizarStatusReuniao, baixarAnexoPauta, criarPauta, detalharReuniao, removerAnexoPauta, uploadAnexoPauta } from '../api/reunioes';
import { atualizarStatusVotacao, criarVotacao } from '../api/votacoes';
import { extractErrorMessage } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { FeatureComingSoon } from '../components/FeatureComingSoon';
import { useAuth } from '../context/AuthContext';
import { formatarDataHora, parseOpcoes } from '../utils/votacoes';
import { VotarSection } from './VotarSection';

const PROXIMO_STATUS_REUNIAO = { Agendada: 'Em_Andamento', Em_Andamento: 'Encerrada' };
const LABEL_ACAO_REUNIAO = { Agendada: 'Iniciar reunião', Em_Andamento: 'Encerrar reunião' };

export function ReuniaoDetailPage() {
  const { id } = useParams();
  const { isAdmin, isVotante } = useAuth();
  const [reuniao, setReuniao] = useState(null);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await detalharReuniao(id);
      setReuniao(dados);
      setErro(null);
    } catch (err) {
      setErro(extractErrorMessage(err, 'Não foi possível carregar a reunião.'));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleAvancarStatusReuniao() {
    const proximo = PROXIMO_STATUS_REUNIAO[reuniao.status];
    if (!proximo) return;
    try {
      await atualizarStatusReuniao(reuniao.id, proximo);
      await carregar();
    } catch (err) {
      setErro(extractErrorMessage(err, 'Não foi possível atualizar o status da reunião.'));
    }
  }

  if (carregando) return <p>Carregando reunião...</p>;
  if (!reuniao) return <p className="error-text">{erro || 'Reunião não encontrada.'}</p>;

  return (
    <div>
      <Link to="/reunioes" className="back-link">
        ← Voltar para reuniões
      </Link>

      <div className="page-header">
        <div>
          <h1>{reuniao.nome_assembleia}</h1>
          <p className="hint-text">{formatarDataHora(reuniao.data, reuniao.hora)}</p>
        </div>
        <div className="page-header-actions">
          <StatusBadge status={reuniao.status} />
          <FeatureComingSoon label="Sala de Vídeo" />
          {isAdmin && PROXIMO_STATUS_REUNIAO[reuniao.status] && (
            <button type="button" className="btn btn-secondary" onClick={handleAvancarStatusReuniao}>
              {LABEL_ACAO_REUNIAO[reuniao.status]}
            </button>
          )}
        </div>
      </div>

      {erro && <p className="error-text">{erro}</p>}
      {aviso && <p className="hint-text">{aviso}</p>}

      {isVotante && reuniao.status === 'Em_Andamento' && (
        <VotarSection reuniaoId={reuniao.id} onVotoRegistrado={carregar} />
      )}

      <h2>Pautas</h2>
      {reuniao.pautas.length === 0 && <p className="hint-text">Nenhuma pauta cadastrada ainda.</p>}
      <div className="pautas-list">
        {reuniao.pautas.map((pauta) => (
          <PautaCard
            key={pauta.id}
            pauta={pauta}
            reuniao={reuniao}
            isAdmin={isAdmin}
            onErro={(msg) => setErro(msg)}
            onAviso={(msg) => setAviso(msg)}
            onAtualizar={carregar}
          />
        ))}
      </div>

      {isAdmin && reuniao.status !== 'Encerrada' && <NovaPautaForm reuniaoId={reuniao.id} onCriada={carregar} onErro={setErro} />}
    </div>
  );
}

function PautaCard({ pauta, reuniao, isAdmin, onErro, onAviso, onAtualizar }) {
  const [mostrarNovaVotacao, setMostrarNovaVotacao] = useState(false);
  const reuniaoEncerrada = reuniao.status === 'Encerrada';

  async function handleBaixarAnexo() {
    try {
      await baixarAnexoPauta(pauta.id, `${pauta.titulo}.pdf`);
    } catch (err) {
      onErro(extractErrorMessage(err, 'Esta pauta não possui anexo.'));
    }
  }

  async function handleRemoverAnexo() {
    if (!window.confirm('Remover o anexo desta pauta? Esta ação não pode ser desfeita.')) return;
    try {
      await removerAnexoPauta(pauta.id);
      onAviso('Anexo removido com sucesso.');
      onAtualizar();
    } catch (err) {
      onErro(extractErrorMessage(err, 'Não foi possível remover o anexo.'));
    }
  }

  async function handleAtualizarStatusVotacao(votacao, status) {
    try {
      await atualizarStatusVotacao(votacao.id, status);
      onAtualizar();
    } catch (err) {
      onErro(extractErrorMessage(err, 'Não foi possível atualizar a votação.'));
    }
  }

  return (
    <div className="card pauta-card">
      <div className="pauta-header">
        <div>
          <h3>{pauta.titulo}</h3>
          <p>{pauta.descricao}</p>
        </div>
        <div className="pauta-actions">
          {pauta.tem_anexo && (
            <button type="button" className="btn btn-ghost" onClick={handleBaixarAnexo}>
              Baixar anexo
            </button>
          )}
          {isAdmin && !reuniaoEncerrada && pauta.tem_anexo && (
            <button type="button" className="btn btn-ghost" onClick={handleRemoverAnexo}>
              Excluir anexo
            </button>
          )}
          {isAdmin && !reuniaoEncerrada && (
            <label className="btn btn-ghost file-btn">
              {pauta.tem_anexo ? 'Substituir anexo' : 'Enviar anexo'}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={async (e) => {
                  const arquivo = e.target.files[0];
                  if (!arquivo) return;
                  try {
                    await uploadAnexoPauta(pauta.id, arquivo);
                    onAviso('Anexo enviado com sucesso.');
                  } catch (err) {
                    onErro(extractErrorMessage(err, 'Não foi possível enviar o anexo.'));
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="votacoes-list">
        {(pauta.votacoes || []).map((votacao) => (
          <div key={votacao.id} className="votacao-row">
            <div>
              <StatusBadge status={votacao.status} />
              <span className="votacao-pergunta">{votacao.pergunta}</span>
              <span className="hint-text">({parseOpcoes(votacao.opcoes).join(' / ')})</span>
            </div>
            <div className="table-actions">
              <Link to={`/votacoes/${votacao.id}/resultados`} className="btn btn-ghost">
                Resultados
              </Link>
              {isAdmin && !reuniaoEncerrada && votacao.status === 'Aguardando' && (
                <button type="button" className="btn btn-secondary" onClick={() => handleAtualizarStatusVotacao(votacao, 'Aberta')}>
                  Abrir votação
                </button>
              )}
              {isAdmin && !reuniaoEncerrada && votacao.status === 'Aberta' && (
                <button type="button" className="btn btn-secondary" onClick={() => handleAtualizarStatusVotacao(votacao, 'Encerrada')}>
                  Encerrar votação
                </button>
              )}
            </div>
          </div>
        ))}
        {(!pauta.votacoes || pauta.votacoes.length === 0) && <p className="hint-text">Nenhuma votação criada para esta pauta.</p>}
      </div>

      {isAdmin && !reuniaoEncerrada && (
        <div className="pauta-nova-votacao">
          {mostrarNovaVotacao ? (
            <NovaVotacaoForm
              pautaId={pauta.id}
              onCriada={() => {
                setMostrarNovaVotacao(false);
                onAtualizar();
              }}
              onCancelar={() => setMostrarNovaVotacao(false)}
              onErro={onErro}
            />
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setMostrarNovaVotacao(true)}>
              + Nova votação para esta pauta
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NovaVotacaoForm({ pautaId, onCriada, onCancelar, onErro }) {
  const [pergunta, setPergunta] = useState('');
  const [tipoResposta, setTipoResposta] = useState('Sim_Nao');
  const [opcoesTexto, setOpcoesTexto] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState(15);
  const [visibilidade, setVisibilidade] = useState('Aberta');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const payload = {
        pauta_id: pautaId,
        pergunta,
        tipo_resposta: tipoResposta,
        duracao_minutos: Number(duracaoMinutos) || 15,
        visibilidade,
      };
      if (tipoResposta !== 'Sim_Nao') {
        payload.opcoes = opcoesTexto
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
      }
      await criarVotacao(payload);
      onCriada();
    } catch (err) {
      onErro(extractErrorMessage(err, 'Não foi possível criar a votação.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Pergunta</span>
        <input type="text" value={pergunta} onChange={(e) => setPergunta(e.target.value)} required />
      </label>
      <label className="field">
        <span>Tipo de resposta</span>
        <select value={tipoResposta} onChange={(e) => setTipoResposta(e.target.value)}>
          <option value="Sim_Nao">Sim / Não</option>
          <option value="Multipla_Escolha">Múltipla Escolha</option>
          <option value="Eleicao">Eleição de Nomes</option>
        </select>
      </label>
      {tipoResposta !== 'Sim_Nao' && (
        <label className="field">
          <span>Opções (separadas por vírgula)</span>
          <input type="text" value={opcoesTexto} onChange={(e) => setOpcoesTexto(e.target.value)} placeholder="Ex: Candidato A, Candidato B" required />
        </label>
      )}
      <label className="field">
        <span>Duração (minutos)</span>
        <input type="number" min="1" value={duracaoMinutos} onChange={(e) => setDuracaoMinutos(e.target.value)} />
      </label>
      <label className="field">
        <span>Visibilidade</span>
        <select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}>
          <option value="Aberta">Aberta (votos individuais visíveis na auditoria)</option>
          <option value="Fechada">Fechada (resultado geral, votos individuais em sigilo)</option>
        </select>
      </label>
      <div className="table-actions">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar votação'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NovaPautaForm({ reuniaoId, onCriada, onErro }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const pauta = await criarPauta(reuniaoId, titulo, descricao);
      if (arquivo) {
        await uploadAnexoPauta(pauta.id, arquivo);
      }
      setTitulo('');
      setDescricao('');
      setArquivo(null);
      onCriada();
    } catch (err) {
      onErro(extractErrorMessage(err, 'Não foi possível criar a pauta.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card inline-form" onSubmit={handleSubmit}>
      <h3>Nova Pauta</h3>
      <label className="field">
        <span>Título</span>
        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
      </label>
      <label className="field">
        <span>Anexo PDF (opcional)</span>
        <input type="file" accept="application/pdf" onChange={(e) => setArquivo(e.target.files[0] || null)} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Inserir Pauta'}
      </button>
    </form>
  );
}
