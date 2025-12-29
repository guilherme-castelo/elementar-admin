import { IPermission } from './permission.model';

export interface IRole {
  id: number;
  name: string;
  description?: string;
  permissions?: IPermission[];
  createdAt?: string;
  updatedAt?: string;
}
