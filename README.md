# SIRILO - Sistema Interativo de Reunião e Integração Local

Este repositório contém a documentação e o código-fonte do protótipo do **SIRILO**, desenvolvido como projeto prático para a disciplina de **Engenharia de Software** do 6º período.

O objetivo do sistema é facilitar a execução de assembleias e votações em condomínios, garantindo que as regras de negócio de representatividade (pesos de lotes) e adimplência sejam cumpridas em tempo real.

---

## 📂 Organização do Repositório

Para manter o projeto limpo e organizado, a documentação de engenharia e a arquitetura do sistema estão localizadas na pasta `docs/`:

*   **[Arquitetura de Software](docs/arquitetura.md)**: Detalhamento completo da arquitetura de três camadas, diagramas de fluxo de dados, justificativas de tecnologia e fases de implementação do protótipo.
*   **[Requisitos do Protótipo](docs/requisitos.txt)**: Lista reduzida de funcionalidades mínimas exigidas para a entrega do trabalho de implementação (Login, Criar Votação, Votar e Resultados).
*   **[Documento de Engenharia de Requisitos (PDF)](docs/ERSW_SIRILO_4_organized.pdf)**: O documento completo original de modelagem de requisitos, diagramas de classe e casos de uso do sistema.

---

## 💻 Estrutura de Código (Em breve)

O projeto será estruturado sob o modelo de monorepo simplificado:

*   `frontend/`: Aplicação web Single-Page Application (SPA) construída com **React.js + Vite** e estilizada com Vanilla CSS.
*   `backend/`: API REST construída com **Node.js + Express.js** para lidar com regras de negócio, validação e auditoria.
*   `sirilo.db`: Banco de dados relacional baseado em arquivo físico (**SQLite**) para persistência portátil.

---

## 🛠️ Tecnologias Principais

*   **Frontend:** React.js, Vite, Vanilla CSS.
*   **Backend:** Node.js, Express.js, Knex.js.
*   **Banco de Dados:** SQLite.
*   **Versionamento:** Git & GitHub.
