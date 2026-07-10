import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resultadosVotacao } from '../api/votacoes';
import { extractErrorMessage } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

const INTERVALO_POLLING_MS = 3000;

export function ResultadosPage() {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    let intervalo;

    async function buscar() {
      try {
        const resultado = await resultadosVotacao(id);
        if (!ativo) return;
        setDados(resultado);
        setErro(null);
        if (resultado.status === 'Encerrada' && intervalo) {
          clearInterval(intervalo);
        }
      } catch (err) {
        if (ativo) setErro(extractErrorMessage(err, 'Não foi possível carregar os resultados.'));
      }
    }

    buscar();
    intervalo = setInterval(buscar, INTERVALO_POLLING_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [id]);

  if (erro) return <p className="error-text">{erro}</p>;
  if (!dados) return <p>Carregando resultados...</p>;

  const maiorPeso = Math.max(1, ...dados.resultados.map((r) => r.peso_total));

  return (
    <div>
      <Link to="/reunioes" className="back-link">
        ← Voltar para reuniões
      </Link>

      <div className="page-header">
        <h1>Resultado da Apuração</h1>
        <StatusBadge status={dados.status} />
      </div>

      <div className="card resultados-summary">
        <div>
          <span className="hint-text">Total de pesos apurados</span>
          <strong>{dados.total_pesos}</strong>
        </div>
        <div>
          <span className="hint-text">Total de votantes</span>
          <strong>{dados.total_votos}</strong>
        </div>
      </div>

      <div className="resultados-list">
        {dados.resultados.map((r) => (
          <div key={r.opcao} className="card resultado-item">
            <div className="resultado-item-header">
              <span>{r.opcao}</span>
              <span>
                {r.peso_total} votos ponderados ({r.percentual}%) · {r.quantidade_votos} votante(s)
              </span>
            </div>
            <div className="resultado-bar-track">
              <div className="resultado-bar-fill" style={{ width: `${(r.peso_total / maiorPeso) * 100}%` }} />
            </div>
          </div>
        ))}
        {dados.resultados.length === 0 && <p className="hint-text">Ainda não há votos registrados.</p>}
      </div>
    </div>
  );
}
