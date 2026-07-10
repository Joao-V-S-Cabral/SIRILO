export function DashboardSummary({ totalReunioes, reunioesEmAndamento, reunioesEncerradas, votacoesAbertas }) {
  return (
    <div className="dashboard-summary">
      <div className="summary-card">
        <span className="summary-card-value">{totalReunioes}</span>
        <span className="summary-card-label">Reuniões cadastradas</span>
      </div>
      <div className="summary-card summary-card-accent">
        <span className="summary-card-value">{votacoesAbertas}</span>
        <span className="summary-card-label">Votações abertas agora</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{reunioesEmAndamento}</span>
        <span className="summary-card-label">Reuniões em andamento</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{reunioesEncerradas}</span>
        <span className="summary-card-label">Reuniões encerradas</span>
      </div>
    </div>
  );
}
