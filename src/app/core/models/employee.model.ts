export interface IEmployee {
  id: string;
  matricula: string;
  firstName: string;
  lastName: string;
  cpf: string;
  funcao: string;
  setor: string;
  dataAdmissao: string; // ISO date string
  dataDemissao?: string; // ISO date string
  companyId: string;
}
