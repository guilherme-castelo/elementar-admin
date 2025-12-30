# Elementar Admin (SaaS)

> **Plataforma Moderna de Gestão de RH e Benefícios**

Este projeto é um fork/clone do repositório original [Elementar Admin](https://github.com/Start-Elementar/elementar-admin.git), que está sendo ativamente evoluído e adaptado para operar como uma plataforma SaaS (Software as a Service) completa e multi-inquilino.

O Elementar Admin é uma aplicação robusta projetada para otimizar as operações de Recursos Humanos, focando especificamente na gestão de funcionários, integração com folha de pagamento (sistema Domínio) e controle de benefícios de refeição corporativa. Construído com as mais recentes tecnologias web, oferece uma interface segura, responsiva e intuitiva para profissionais de RH.

---

## 🚀 Principais Funcionalidades

### 👥 Gestão de Funcionários

- **Base Centralizada**: Mantenha registros detalhados de todos os funcionários e seu histórico de alocação.
- **Importação Inteligente**: Importação em massa de funcionários via CSV/JSON com validação em tempo real e feedback de erros através de componentes de UI modernos.
- **Gestão de Demissões**: Fluxos automatizados para demissão de funcionários, incluindo tratamento transacional de ativos vinculados e registros de refeição (Excluir, Desvincular ou Ignorar).

### 🍽️ Gestão de Benefícios de Refeição

- **Integração REP**: Importe dados diretamente de Registradores Eletrônicos de Ponto.
- **Relatórios Detalhados**: Gere matrizes semanais e mensais para análise estratégica de custos.
- **Integração com Folha**: Exporte dados consolidados compatíveis com sistemas de folha de pagamento Domínio.
- **Controle de Custos**: Acompanhe custos de refeição diários, semanais e mensais por setor ou funcionário.

### 🛡️ Segurança e Acesso

- **Controle de Acesso Baseado em Função (RBAC)**: Gestão granular de permissões com matriz dinâmica na UI.
- **Autenticação JWT**: Gestão de sessão segura baseada em tokens.
- **Multi-Inquilino (Multi-Tenancy)**: Projetado para arquitetura SaaS com isolamento de dados.

---

## 🛠️ Stack Tecnológica

Este projeto é construído usando uma stack moderna e escalável:

- **Framework**: [Angular 19](https://angular.dev/) (Componentes Standalone, Signals)
- **Sistema de UI**: [Angular Material](https://material.angular.io/) & [ElementarUI](https://elementar-ui.com) (Biblioteca de Componentes Customizada)
- **Estilização**: [TailwindCSS](https://tailwindcss.com/)
- **Gráficos**: Apache ECharts
- **Cliente HTTP**: Angular `HttpClient` com Interceptors (Auth, Tratamento de Erros)

---

## 🏁 Começando

### Pré-requisitos

Certifique-se de ter o seguinte instalado:

- **Node.js** (v18 ou superior)
- **npm** (v10 ou superior)
- **Git**

### Instalação

1. **Clone o repositório**

   ```bash
   git clone https://github.com/guilherme-castelo/elementar-admin.git
   cd elementar-admin
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

### Executando Localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm start
# ou
ng serve
```

Navegue para `http://localhost:4200/`. A aplicação será recarregada automaticamente se você alterar qualquer um dos arquivos de origem.

> **Nota**: Certifique-se de que a API backend (`backend-elementar`) esteja rodando na porta configurada (padrão: 3000) para funcionalidade completa.

---

## 🤝 Diretrizes de Contribuição

Seguimos práticas rigorosas de engenharia para garantir a qualidade e manutenibilidade do código.

### Padrões de Código

- **Conventional Commits**: Todos os commits DEVEM seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/).
  - `feat(escopo): ...` para novas funcionalidades
  - `fix(escopo): ...` para correções de bugs
  - `refactor(escopo): ...` para melhorias de código sem alteração de lógica
  - `chore(escopo): ...` para tarefas de manutenção
- **Linting**: Garanta 0 erros de linting antes de enviar.
- **UI/UX**: Siga o Design System estabelecido. NÃO introduza novos Frameworks CSS ou sobrescreva estilos globais sem aprovação. Use `MatDialog` e `MatSnackBar` para feedback ao usuário.

### Fluxo de Trabalho Típico

1. Crie uma branch de feature a partir da `main`: `git checkout -b feat/minha-feature`
2. Implemente suas alterações.
3. Commit com uma mensagem descritiva: `git commit -m "feat(funcionarios): adiciona modal de demissao"`
4. Push para a origem e abra um Pull Request.

---

## 📄 Licença

Software Proprietário. Todos os direitos reservados à **Start Elementar**.
