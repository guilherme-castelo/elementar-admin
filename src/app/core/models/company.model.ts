export interface ICompany {
  id: number;
  name: string;
  cnpj?: string;
  isActive: boolean;
  address?: string; // Or structured if backend changes, currently string in routes/docs but maybe structured in future
  
  // SaaS Fields
  planId?: number;
  status?: string;
  subscriptionExpiresAt?: string;

  createdAt?: string;
  updatedAt?: string;
}
