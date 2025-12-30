export interface IMeal {
  id: number;
  // employeeId is now optional for unlinked imports
  employeeId?: number;
  companyId: number;
  date: string;
  price: number;

  // Snapshots for history / unlinked records
  matriculaSnapshot?: string;
  employeeNameSnapshot?: string;
  employeeSectorSnapshot?: string;
  status?: 'LINKED' | 'PENDING_LINK';
  ignoredInExport?: boolean;

  // Flattened fields from backend usually
  sector?: string;
  employeeName?: string;
  employeeMatricula?: string;
  // price removed (dup)
  periodStart: string; // ISO Date YYYY-MM-DD
  periodEnd: string; // ISO Date YYYY-MM-DD

  createdAt?: string;

  // Nested relation from backend
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    matricula: string;
    setor: string;
    funcao?: string;
  };
}
