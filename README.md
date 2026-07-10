# SIRILO - Sistema Interativo de Reunião e Integração Local v2.0

Este repositório contém o código-fonte e a documentação do sistema **SIRILO**, desenvolvido como projeto prático para a disciplina de **Engenharia de Software** do 6º período.

O objetivo do sistema é facilitar a execução de assembleias e votações em condomínios, garantindo o cumprimento de regras de negócio de representatividade (pesos de lotes), adimplência e auditoria em tempo real.

---

## 🚀 Status do Projeto (Versão Estável)

O projeto está em sua versão estável, com todas as regras de negócio integradas e testadas. Os seguintes recursos estão implementados:

- **Autenticação Segura (JWT):** Login simplificado e proteção de rotas para Administradores, Proprietários e Procuradores.
- **Painel do Administrador:** Interface completa para iniciar reuniões, criar pautas, anexar documentos, gerenciar votações e visualizar logs de auditoria.
- **Painel do Proprietário & Procurador (Responsivo):** Interface adaptada para dispositivos móveis para que os condôminos possam votar de seus smartphones durante a assembleia.
- **Votação e Persistência:**
  - Validação de adimplência (proprietários inadimplentes votam com **peso zero**).
  - Cálculo ponderado com base na fração ideal dos lotes (ex.: terreno = 1.0, casa construída = 2.0).
  - Persistência no recarregamento da página (F5): o voto ativo e o cronômetro de contagem regressiva sobrevivem ao reload.
  - Encerramento automático de votações por tempo limite (timeout).
- **Exclusão de Anexos:** Controle de upload e exclusão de arquivos PDF anexados às pautas.
- **Restrições de Reunião Encerrada:** Quando uma reunião é marcada como *Encerrada*, o backend encerra todas as votações ativas em cascata e impede ações administrativas ou novos votos.
- **Dashboard de Resultados em Tempo Real:** Tela de apuração com gráfico dinâmico atualizado via Polling de 2 segundos.
- **Log de Auditoria:** Registro detalhado de logs contendo IP, navegador (User-Agent), timestamp e ações executadas por cada usuário.

---

## 📂 Organização do Repositório

Toda a documentação técnica relevante está concentrada na pasta `docs/`:

- 📐 **[Arquitetura de Software](docs/arquitetura.md)**: Detalhamento da arquitetura em 3 camadas, diagramas de fluxo de dados, esquema físico e justificativa técnica das decisões do protótipo.
- 📄 **[Documento de Engenharia de Requisitos (PDF)](docs/ERSW_SIRILO_4_organized.pdf)**: Modelagem de casos de uso, diagrama de classes conceituais e requisitos completos do sistema original.

---

## 🏗️ Estrutura de Código (Monorepo)

O projeto está estruturado em um formato de monorepo prático e simplificado:

- **`frontend/`**: Aplicação Web Single-Page (SPA) construída com **React.js + Vite** e estilizada com **Vanilla CSS** (CSS Variables, tema corporativo azul-institucional/laranja e foco em alta acessibilidade e responsividade).
- **`backend/`**: API REST robusta em **Node.js + Express.js**, utilizando **Knex.js** para consultas e **Multer** para upload de arquivos.
- **`sirilo.db`**: Banco de dados relacional portátil utilizando **SQLite3**.

---

## 🛠️ Como Executar o Projeto

Certifique-se de ter o **Node.js** instalado na sua máquina (versão 18 ou superior recomendada).

### 1. Instalar as Dependências
Na pasta raiz do projeto, execute o comando abaixo para instalar as dependências de todas as camadas recursivamente:
```bash
npm run install-all
```

### 2. Iniciar o Ambiente de Desenvolvimento
Rode o comando a seguir na raiz para subir o backend e o frontend concorrentemente:
```bash
npm run dev
```

- 🖥️ **Frontend:** Disponível em `http://localhost:5173` (acessível na rede local se executado com a flag `host`).
- ⚙️ **Backend:** Rodando localmente em `http://localhost:3001` (escutando estritamente em `127.0.0.1`).

### ⚙️ Configuração e Variáveis de Ambiente

O Backend possui suporte a variáveis de ambiente para customização local:
*   `PORT`: Define a porta em que o servidor Express irá escutar (padrão: `3001`).
*   `JWT_SECRET`: A chave de criptografia usada para assinar e validar tokens JWT (padrão: `'sirilo_prototipo_chave_de_desenvolvimento'`).

> 💡 **Dica de Desenvolvimento:** Caso altere a variável `PORT` do backend, lembre-se de atualizar o endereço em `target` nas configurações de proxy do arquivo `frontend/vite.config.js` para manter a comunicação da API ativa.

---

## 🧪 Testes Automatizados

O backend possui uma suíte robusta com **47 testes automatizados** divididos em **8 suítes de testes** cobrindo todas as regras de negócios críticas usando **Jest** e **Supertest**.

Para rodar os testes:

### No Windows (PowerShell):
```powershell
cd backend
$env:NODE_ENV="test"
npx jest --runInBand --forceExit
```

### No Linux / macOS (Terminal):
```bash
cd backend
npm run test
```

### Suítes de Testes Disponíveis:
1. `votacao_expiracao.test.js`: Valida o encerramento automático das votações por decurso de prazo.
2. `voto_persistencia.test.js`: Testa a correta persistência e consulta do estado de voto ativo do usuário.
3. `reuniao_encerrada.test.js`: Assegura o bloqueio de ações pós-encerramento de reuniões e finalização das votações em cascata.
4. `votacao_regras_negocio.test.js`: Valida unicidade de votos, regras de adimplência (peso zero) e pesos ponderados dos lotes.
5. `anexo.test.js`: Testa upload, validação e remoção de arquivos em pautas.
6. `auth.test.js`: Cobre autenticação por senha (Admin/Proprietário) e token de reunião (Procurador).
7. `seguranca.test.js`: Garante a proteção de endpoints contra acessos não autorizados.
8. `auditoria.test.js`: Valida o registro correto de acessos e ações nos logs de auditoria.

---

## 👥 Credenciais de Demonstração (Massa de Teste Seed)

O banco de dados é inicializado com dados padrões para facilitar simulações e apresentações. Na tela de login, há **botões de atalho** para entrada rápida nos seguintes perfis:

| Perfil | Email / Token | Senha | Detalhes / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@sirilo.com` | `admin123` | Permissões totais para gerenciar reuniões, pautas e logs. |
| **Proprietário A** | `proprietario_a@sirilo.com` | `senha123` | **Adimplente**. Possui 2 lotes (Casas). Peso do voto: **4.0**. |
| **Proprietário B** | `proprietario_b@sirilo.com` | `senha123` | **Adimplente**. Possui 1 lote (Terreno). Peso do voto: **1.0**. |
| **Proprietário C** | `proprietario_c@sirilo.com` | `senha123` | **Inadimplente**. Possui 1 lote (Casa). Peso do voto: **0.0** (voto computado sem impacto no total). |
| **Procurador D** | `PROCURADOR_DEMO` *(Token)* | *N/A* | **Representante** do Proprietário D (Adimplente, Terreno, Peso **1.0**). |
