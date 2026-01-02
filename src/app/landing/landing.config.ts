export interface LandingConfig {
  global: {
    productName: string;
    logoIcon: string;
    links: { label: string; action: string; type: 'scroll' | 'router' }[];
    authLinks: {
      login: { label: string; route: string };
      signup: { label: string; route: string };
      dashboard: { label: string; route: string };
    };
  };
  sections: SectionConfig[];
}

export type SectionConfig =
  | HeroSection
  | BenefitsSection
  | FeaturesSection
  | HowItWorksSection
  | TestimonialsSection
  | PricingSection
  | FaqSection;

export interface BaseSection {
  id: string;
  type:
    | 'hero'
    | 'benefits'
    | 'features'
    | 'how-it-works'
    | 'testimonials'
    | 'pricing'
    | 'faq';
  isActive: boolean;
  title?: string;
  subtitle?: string;
  containerClass?: string; // e.g. 'container'
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  badge: string;
  headline: string;
  subheadline: string;
  ctas: { label: string; action: string; style: 'flat' | 'stroked' }[];
  trustText: string;
  trustIcon: string;
}

export interface BenefitsSection extends BaseSection {
  type: 'benefits';
  cards: { icon: string; title: string; description: string }[];
}

export interface FeaturesSection extends BaseSection {
  type: 'features';
  items: {
    title: string;
    description: string;
    visualText: string; // Placeholder for visual/image
    reverse?: boolean;
    list: string[];
  }[];
}

export interface HowItWorksSection extends BaseSection {
  type: 'how-it-works';
  steps: { icon: string; title: string; description: string }[];
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials';
  items: { content: string; author: string; role: string; avatar: string }[];
}

export interface PricingSection extends BaseSection {
  type: 'pricing';
  plans: {
    name: string;
    subtitle: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    highlighted?: boolean;
    tag?: string;
  }[];
}

export interface FaqSection extends BaseSection {
  type: 'faq';
  items: { question: string; answer: string }[];
}

export const landingPageConfig: LandingConfig = {
  global: {
    productName: 'Elementar',
    logoIcon: 'grid_view',
    links: [
      { label: 'Funcionalidades', action: 'features', type: 'scroll' },
      { label: 'Benefícios', action: 'benefits', type: 'scroll' },
      { label: 'Planos', action: 'pricing', type: 'scroll' },
    ],
    authLinks: {
      login: { label: 'Entrar', route: '/auth/signin' },
      signup: { label: 'Criar Conta', route: '/auth/signup' },
      dashboard: { label: 'Ir para Dashboard', route: '/dashboard' },
    },
  },
  sections: [
    {
      id: 'home',
      type: 'hero',
      isActive: true,
      badge: 'Novo: Integração com Chat',
      headline: 'O Sistema Operacional para Refeitórios e Equipes',
      subheadline:
        'Centralize o custo das refeições, gerencie dados de colaboradores e organize tarefas do RH em uma plataforma segura.',
      ctas: [
        { label: 'Começar Agora', action: 'signup', style: 'flat' }, // Action handled by logic
        { label: 'Ver Demonstração', action: 'demo', style: 'stroked' },
      ],
      trustText: 'Usado por mais de 50 empresas',
      trustIcon: 'verified',
    },
    {
      id: 'benefits',
      type: 'benefits',
      isActive: true,
      title: 'Chega de Caos Administrativo',
      cards: [
        {
          icon: 'table_view',
          title: 'Planilhas Confusas',
          description:
            'Perda de tempo consolidando gastos de refeitório em Excel que nunca fecha.',
        },
        {
          icon: 'person_off',
          title: 'Dados Dispersos',
          description:
            'Informações de colaboradores espalhadas em e-mails e sistemas antigos.',
        },
        {
          icon: 'message',
          title: 'WhatsApp Pessoal',
          description:
            'Comunicação da empresa misturada com conversas pessoais, sem auditoria.',
        },
      ],
    },
    {
      id: 'features',
      type: 'features',
      isActive: true,
      title: 'Tudo o que você precisa',
      items: [
        {
          title: 'Gestão de Refeições',
          description:
            'Controle cada refeição servida. Saiba quem comeu, quando e quanto custou.',
          visualText: 'Meals Table Mockup',
          reverse: true, // Based on 'feature-block reverse' class
          list: [
            'Relatórios por Centro de Custo',
            'Auditoria de fornecedores',
            'Histórico completo do colaborador',
          ],
        },
        {
          title: 'Base de Colaboradores',
          description:
            'Um dossiê digital completo dos seus funcionários. Simples, seguro e centralizado.',
          visualText: 'Employee Profile Mockup',
          list: [
            'Cadastro completo (CPF, Matrícula)',
            'Histórico de setor e função',
            'Integração com ponto (em breve)',
          ],
        },
        {
          title: 'Produtividade Integrada',
          description:
            'Não pague por Trello ou Slack separadamente. O Elementar já traz o essencial.',
          visualText: 'Kanban Board Mockup',
          reverse: true,
          list: [
            'Kanban: Organize tarefas visuais',
            'Messenger: Chat corporativo seguro',
            'Notificações: Tudo em tempo real',
          ],
        },
      ],
    },
    {
      id: 'how-it-works',
      type: 'how-it-works',
      isActive: true,
      title: 'Como Funciona',
      subtitle: 'Simples e direto, sem burocracia.',
      steps: [
        {
          icon: 'person_add',
          title: '1. Cadastro Rápido',
          description:
            'Crie sua conta em segundos e configure o perfil da sua empresa.',
        },
        {
          icon: 'groups',
          title: '2. Convide a Equipe',
          description:
            'Adicione colaboradores e defina níveis de acesso personalizados.',
        },
        {
          icon: 'dashboard',
          title: '3. Gestão Completa',
          description:
            'Acompanhe refeições, tarefas e relatórios em um só lugar.',
        },
      ],
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      isActive: true,
      title: 'Quem usa aprova',
      items: [
        {
          content:
            'A Elementar transformou como gerenciamos nosso refeitório. A economia foi imediata.',
          author: 'Carlos Silva',
          role: 'Gerente de RH',
          avatar: 'assets/images/avatars/user-1.jpg',
        },
        {
          content:
            'Finalmente um sistema que une comunicação e processos. Minha equipe adora.',
          author: 'Ana Souza',
          role: 'Diretora Operacional',
          avatar: 'assets/images/avatars/user-2.jpg',
        },
        {
          content:
            'O suporte é incrível e a plataforma muito intuitiva. Recomendo para qualquer empresa.',
          author: 'Ricardo Mendes',
          role: 'CEO, TechSolutions',
          avatar: 'assets/images/avatars/user-3.jpg',
        },
      ],
    },
    {
      id: 'pricing',
      type: 'pricing',
      isActive: false,
      title: 'Planos Transparentes',
      subtitle: 'Escolha o melhor para sua operação.',
      plans: [
        {
          name: 'Starter',
          subtitle: 'Para pequenas empresas',
          price: 'R$ 0',
          period: '/mês',
          features: [
            'Até 50 Colaboradores',
            'Gestão de Refeições Básica',
            '1 Usuário Admin',
          ],
          cta: 'Começar Grátis',
        },
        {
          name: 'Growth',
          subtitle: 'Para empresas em expansão',
          price: 'R$ 299',
          period: '/mês',
          features: [
            'Até 500 Colaboradores',
            'Gestão de Refeições Completa',
            'Chat & Tarefas Ilimitados',
            '5 Usuários Admin',
          ],
          cta: 'Assinar Agora',
          highlighted: true,
          tag: 'Popular',
        },
        {
          name: 'Enterprise',
          subtitle: 'Grandes operações',
          price: 'Sob Consulta',
          period: '',
          features: [
            'Colaboradores Ilimitados',
            'API de Integração',
            'SSO & Audit Logs',
            'Suporte Dedicado',
          ],
          cta: 'Falar com Vendas',
        },
      ],
    },
    {
      id: 'faq',
      type: 'faq',
      isActive: true,
      title: 'Perguntas Frequentes',
      items: [
        {
          question: 'Preciso instalar algum software?',
          answer:
            'Não! A Elementar é 100% na nuvem. Você acessa de qualquer lugar, pelo navegador.',
        },
        {
          question: 'Como funciona a cobrança?',
          answer:
            'Temos planos fixos mensais baseados no tamanho da sua empresa. Sem taxas ocultas.',
        },
        {
          question: 'Posso cancelar a qualquer momento?',
          answer:
            'Sim, nossos planos não possuem fidelidade. Você é livre para cancelar quando quiser.',
        },
        {
          question: 'É seguro colocar meus dados?',
          answer:
            'Com certeza. Utilizamos criptografia de ponta a ponta e seguimos todas as normas da LGPD.',
        },
      ],
    },
  ],
};
