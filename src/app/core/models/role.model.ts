import { IPermission } from './permission.model';
import { ICompany } from './company.model';

export interface IRole {
  id: number;
  name: string;
  description?: string;
  permissions?: IPermission[];
  companies?: ICompany[];
  createdAt?: string;
  updatedAt?: string;
}
