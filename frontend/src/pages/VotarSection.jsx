import { useEffect, useRef, useState } from 'react';
import { votacaoAtiva, votar } from '../api/votacoes';
import { extractErrorMessage } from '../api/client';
import { parseOpcoes } from '../utils/votacoes';

const INTERVALO_POLLING_MS = 3000;

export function VotarSection({ reuniaoId, onVotoRegistrado }) {
  const [votacao, setVotacao] = useState(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [votadoAgora, setVotadoAgora] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const votacaoAnteriorId = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        const dados = await votacaoAtiva(reuniaoId);
        if (!ativo) return;
        setVotacao(dados);
        if (dados && dados.id !== votacaoAnteriorId.current) {
          votacaoAnteriorId.current = dados.id;
          setVotadoAgora(false);
          setMensagemSucesso(null);
          setOpcaoSelecionada('');
          setSegundosRestantes((dados.duracao_minutos || 0) * 60);
        }
        if (!dados) {
          votacaoAnteriorId.current = null;
        }
      } catch {
        // Falha de polling é silenciosa; próxima tentativa em breve.
      }
    }

    buscar();
    const intervalo = setInterval(buscar, INTERVALO_POLLING_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [reuniaoId]);

  useEffect(() => {
    if (segundosRestantes === null || segundosRestantes <= 0) return;
    const timer = setInterval(() => {
      setSegundosRestantes((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosRestantes]);

  async function handleVotar(e) {
    e.preventDefault();
    if (!opcaoSelecionada) return;
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await votar(votacao.id, opcaoSelecionada);
      setMensagemSucesso(resultado.message);
      setVotadoAgora(true);
      onVotoRegistrado?.();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Não foi possível registrar o voto.');
      setErro(msg);
      if (err?.response?.status === 409) setVotadoAgora(true);
    } finally {
      setEnviando(false);
    }
  }

  if (!votacao) {
    return (
      <div className="card votar-card">
        <p className="hint-text">Nenhuma votação aberta neste momento.</p>
      </div>
    );
  }

  const opcoes = parseOpcoes(votacao.opcoes);
  const minutos = segundosRestantes !== null ? Math.floor(segundosRestantes / 60) : null;
  const segundos = segundosRestantes !== null ? segundosRestantes % 60 : null;

  return (
    <div className="card votar-card">
      <div className="votar-header">
        <h2>Votação em andamento</h2>
        {segundosRestantes !== null && (
          <span className="timer" title="Cronômetro estimado, iniciado a partir da abertura desta votação nesta sessão">
            {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </span>
        )}
      </div>
      <p className="votar-pergunta">{votacao.pergunta}</p>

      {votadoAgora ? (
        <p className="success-text">{mensagemSucesso || 'Voto já registrado nesta votação.'}</p>
      ) : (
        <form onSubmit={handleVotar}>
          <div className="opcoes-list">
            {opcoes.map((opcao) => (
              <label key={opcao} className="opcao-item">
                <input
                  type="radio"
                  name="opcao"
                  value={opcao}
                  checked={opcaoSelecionada === opcao}
                  onChange={() => setOpcaoSelecionada(opcao)}
                />
                {opcao}
              </label>
            ))}
          </div>
          {erro && <p className="error-text">{erro}</p>}
          <button type="submit" className="btn btn-primary btn-large" disabled={enviando || !opcaoSelecionada}>
            {enviando ? 'Registrando...' : 'Confirmar voto'}
          </button>
        </form>
      )}
    </div>
  );
}
