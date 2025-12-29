export interface IMeal {
  id: number;
  
  // Relations
  employeeId: number;
  companyId: number;
  
  // Snapshots (Historical Integrity)
  employeeNameSnapshot?: string;
  employeeSectorSnapshot?: string;
  
  // Helpers from Join (Legacy/Convenience)
  employeeName?: string;
  sector?: string;
  employeeMatricula?: string;

  // Data
  date: string; // ISO Date YYYY-MM-DD
  price: number;
  periodStart: string; // ISO Date YYYY-MM-DD
  periodEnd: string; // ISO Date YYYY-MM-DD
  
  createdAt?: string;
}
