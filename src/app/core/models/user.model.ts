export interface IUser {
  id: string | number;
  name: string;
  email: string;
  password?: string;
  companyId: string | number;
  roles: string[];

  // Profile fields
  phone?: string;
  jobTitle?: string;
  bio?: string;
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
