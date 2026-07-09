import { useEffect, useRef, useState } from 'react';
import { meuVoto as buscarMeuVoto, votacaoAtiva, votar } from '../api/votacoes';
import { extractErrorMessage } from '../api/client';
import { parseOpcoes, segundosRestantes as calcularSegundosRestantes } from '../utils/votacoes';

const INTERVALO_POLLING_MS = 3000;

export function VotarSection({ reuniaoId, onVotoRegistrado }) {
  const [votacao, setVotacao] = useState(null);
  const [meuVoto, setMeuVoto] = useState(null);
  const [carregandoMeuVoto, setCarregandoMeuVoto] = useState(true);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(null);
  const votacaoAnteriorId = useRef(null);

  // Poll da votação ativa da reunião. Ao detectar uma votação nova (ou o
  // primeiro carregamento da página), busca se esta sessão já votou nela -
  // isso é o que faz o estado sobreviver a um recarregamento de página,
  // em vez de depender só de estado local do componente.
  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        const dados = await votacaoAtiva(reuniaoId);
        if (!ativo) return;
        setVotacao(dados);

        const idAtual = dados?.id ?? null;
        if (idAtual !== votacaoAnteriorId.current) {
          votacaoAnteriorId.current = idAtual;
          setOpcaoSelecionada('');
          setErro(null);
          setMensagemSucesso(null);

          if (!dados) {
            setMeuVoto(null);
            setCarregandoMeuVoto(false);
            return;
          }

          setCarregandoMeuVoto(true);
          try {
            const voto = await buscarMeuVoto(dados.id);
            if (ativo) setMeuVoto(voto);
          } catch {
            if (ativo) setMeuVoto(null);
          } finally {
            if (ativo) setCarregandoMeuVoto(false);
          }
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

  // Cronômetro: sempre recalculado a partir de votacao.aberta_em (gravado
  // pelo servidor), nunca de uma contagem local - assim ele mostra o tempo
  // real restante mesmo depois de recarregar a página ou trocar de aparelho.
  useEffect(() => {
    if (!votacao) {
      setTempoRestante(null);
      return;
    }
    setTempoRestante(calcularSegundosRestantes(votacao));
    const timer = setInterval(() => {
      setTempoRestante(calcularSegundosRestantes(votacao));
    }, 1000);
    return () => clearInterval(timer);
  }, [votacao]);

  async function handleVotar(e) {
    e.preventDefault();
    if (!opcaoSelecionada) return;
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await votar(votacao.id, opcaoSelecionada);
      setMensagemSucesso(resultado.message);
      setMeuVoto({ opcao_escolhida: opcaoSelecionada, peso_aplicado: resultado.peso_aplicado });
      onVotoRegistrado?.();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Não foi possível registrar o voto.');
      setErro(msg);
      if (err?.response?.status === 409) {
        try {
          const voto = await buscarMeuVoto(votacao.id);
          setMeuVoto(voto);
        } catch {
          // Se nem isso funcionar, o erro acima já foi exibido ao usuário.
        }
      }
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
  const minutos = tempoRestante !== null ? Math.floor(tempoRestante / 60) : null;
  const segundos = tempoRestante !== null ? tempoRestante % 60 : null;

  return (
    <div className="card votar-card">
      <div className="votar-header">
        <h2>Votação em andamento</h2>
        {tempoRestante !== null && (
          <span className="timer" title="Tempo restante para o encerramento automático desta votação">
            {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </span>
        )}
      </div>
      <p className="votar-pergunta">{votacao.pergunta}</p>

      {carregandoMeuVoto ? (
        <p className="hint-text">Verificando seu voto...</p>
      ) : meuVoto ? (
        <p className="success-text">
          {mensagemSucesso || `Você votou em "${meuVoto.opcao_escolhida}" (peso aplicado: ${meuVoto.peso_aplicado}).`}
        </p>
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
