import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { atualizarStatusReuniao, detalharReuniao, listarReunioes } from '../api/reunioes';
import { extractErrorMessage } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardSummary } from '../components/DashboardSummary';
import { useAuth } from '../context/AuthContext';
import { formatarDataHora } from '../utils/votacoes';

const PROXIMO_STATUS = {
  Agendada: 'Em_Andamento',
  Em_Andamento: 'Encerrada',
};

const LABEL_ACAO = {
  Agendada: 'Iniciar reunião',
  Em_Andamento: 'Encerrar reunião',
};

export function ReunioesListPage() {
  const { isAdmin } = useAuth();
  const [reunioes, setReunioes] = useState([]);
  const [votacoesAbertas, setVotacoesAbertas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizandoId, setAtualizandoId] = useState(null);

  async function contarVotacoesAbertas(listaReunioes) {
    const emAndamento = listaReunioes.filter((r) => r.status === 'Em_Andamento');
    const detalhes = await Promise.all(
      emAndamento.map((r) => detalharReuniao(r.id).catch(() => null))
    );
    return detalhes
      .filter(Boolean)
      .flatMap((r) => r.pautas || [])
      .flatMap((p) => p.votacoes || [])
      .filter((v) => v.status === 'Aberta').length;
  }

  async function carregar() {
    try {
      const dados = await listarReunioes();
      setReunioes(dados);
      setErro(null);
      const abertas = await contarVotacoesAbertas(dados);
      setVotacoesAbertas(abertas);
    } catch (err) {
      setErro(extractErrorMessage(err, 'Não foi possível carregar as reuniões.'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleAvancarStatus(reuniao) {
    const proximo = PROXIMO_STATUS[reuniao.status];
    if (!proximo) return;
    setAtualizandoId(reuniao.id);
    try {
      await atualizarStatusReuniao(reuniao.id, proximo);
      await carregar();
    } catch (err) {
      setErro(extractErrorMessage(err, 'Não foi possível atualizar o status.'));
    } finally {
      setAtualizandoId(null);
    }
  }

  if (carregando) return <p>Carregando reuniões...</p>;

  const reunioesEmAndamento = reunioes.filter((r) => r.status === 'Em_Andamento').length;
  const reunioesEncerradas = reunioes.filter((r) => r.status === 'Encerrada').length;

  return (
    <div>
      <div className="page-header">
        <h1>Reuniões</h1>
      </div>

      {erro && <p className="error-text">{erro}</p>}

      <DashboardSummary
        totalReunioes={reunioes.length}
        reunioesEmAndamento={reunioesEmAndamento}
        reunioesEncerradas={reunioesEncerradas}
        votacoesAbertas={votacoesAbertas}
      />

      {!isAdmin && (
        <p className="hint-text">
          O cadastro de novas reuniões é feito pela administração do condomínio.
        </p>
      )}

      <div className="card table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Assembleia</th>
              <th>Data</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reunioes.map((r) => (
              <tr key={r.id}>
                <td>{r.nome_assembleia}</td>
                <td>{formatarDataHora(r.data, r.hora)}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="table-actions">
                  <Link to={`/reunioes/${r.id}`} className="btn btn-ghost">
                    Abrir
                  </Link>
                  {isAdmin && PROXIMO_STATUS[r.status] && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={atualizandoId === r.id}
                      onClick={() => handleAvancarStatus(r)}
                    >
                      {LABEL_ACAO[r.status]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {reunioes.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  Nenhuma reunião cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
