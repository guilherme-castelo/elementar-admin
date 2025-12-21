export interface IMeal {
  id: string;
  employeeId: string;
  employeeMatricula: string;
  employeeName: string;
  sector: string;
  companyId: string | number;
  date: string; // ISO Date YYYY-MM-DD
  price: number;
  periodStart: string; // ISO Date YYYY-MM-DD
  periodEnd: string; // ISO Date YYYY-MM-DD
  createdAt: string;
}
