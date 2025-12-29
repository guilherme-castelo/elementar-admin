import { IRole } from './role.model';

export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  
  // Relations
  companyId?: number;
  roleId?: number;
  role?: IRole; // Backend returns full object on many endpoints
  
  // Flattened for Helper (Optional) but better to remove if strict
  // roles?: string[]; // Deprecated in favor of role.permissions.map(slug)
  
  isActive: boolean;
  
  // Profile fields
  phone?: string;
  jobTitle?: string;
  bio?: string;
  avatar?: string;
  
  // JSON Fields (parsed)
  address?: {
    country: string;
    city: string;
    street: string;
    postalCode: string;
    building?: number | string;
    apartment?: number | string;
  };
  preferences?: {
    language: { code: string; name: string };
    dateFormat: string;
    automaticTimeZone: { name: string; isEnabled: boolean };
  };

  createdAt?: string;
  updatedAt?: string;
}

// DTO for Transport (if needed for flat strings)
export interface IUserDTO {
  id: number;
  name: string;
  email: string;
  address?: string; // stringified JSON
  preferences?: string; // stringified JSON
  // ...
}
