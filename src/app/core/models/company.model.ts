import { IUser } from './user.model';
import { IRole } from './role.model';

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

  managerId?: number;
  manager?: IUser;
  roles?: IRole[];

  createdAt?: string;
  updatedAt?: string;
}
