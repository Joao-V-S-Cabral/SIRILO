# SIRILO - Sistema Interativo de Reunião e Integração Local

Este repositório contém a documentação e o código-fonte do protótipo do **SIRILO**, desenvolvido como projeto prático para a disciplina de **Engenharia de Software** do 6º período.

O objetivo do sistema é facilitar a execução de assembleias e votações em condomínios, garantindo que as regras de negócio de representatividade (pesos de lotes) e adimplência sejam cumpridas em tempo real.

---

## 📂 Organização do Repositório

Para manter o projeto limpo e organizado, a documentação de engenharia e a arquitetura do sistema estão localizadas na pasta `docs/`:

*   **[Arquitetura de Software](docs/arquitetura.md)**: Detalhamento completo da arquitetura de três camadas, diagramas de fluxo de dados, justificativas de tecnologia e fases de implementação do protótipo.
*   **[Requisitos do Protótipo](docs/requisitos.txt)**: Lista reduzida de funcionalidades mínimas exigidas para a entrega do trabalho de implementação (Login, Criar Votação, Votar e Resultados).
*   **[Documento de Engenharia de Requisitos (PDF)](docs/ERSW_SIRILO_4_organized.pdf)**: O documento completo original de modelagem de requisitos, diagramas de classe e casos de uso do sistema.
*   **[Setup da Fase 1](docs/fase1_setup.md)**: Documentação detalhando o setup inicial do monorepo, backend e frontend.
*   **[Setup da Fase 2](docs/fase2_setup.md)**: Documentação detalhando a modelagem do banco de dados, migrações e sementes.

---

## 💻 Estrutura de Código

O projeto está estruturado sob o modelo de monorepo simplificado:

*   `frontend/`: Aplicação web Single-Page Application (SPA) construída com **React.js + Vite** e estilizada com Vanilla CSS.
*   `backend/`: API REST construída com **Node.js + Express.js** para lidar com regras de negócio, validação e auditoria.
*   `sirilo.db`: Banco de dados relacional baseado em arquivo físico (**SQLite**) para persistência portátil.

---

## 🚀 Como Executar o Projeto

Certifique-se de ter o **Node.js** instalado em sua máquina.

### 1. Instalar as Dependências
Execute o comando abaixo na raiz do projeto para instalar recursivamente todas as dependências da raiz, do frontend e do backend:
```bash
npm run install-all
```

### 2. Iniciar o Ambiente de Desenvolvimento
Execute o seguinte comando na raiz para rodar o backend e o frontend concorrentemente:
```bash
npm run dev
```

*   **Frontend**: Disponível em `http://localhost:5173` (ou porta indicada no terminal).
*   **Backend**: Rodando em `http://localhost:3001`.

---

## 🛠️ Tecnologias Principais

*   **Frontend:** React.js, Vite, Vanilla CSS.
*   **Backend:** Node.js, Express.js, Knex.js.
*   **Banco de Dados:** SQLite.
*   **Versionamento:** Git & GitHub.
