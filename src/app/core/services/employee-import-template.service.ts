import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmployeeImportTemplateService {

  private readonly SAMPLE_DATA = [
    {
      matricula: "1001",
      firstName: "Ana",
      lastName: "Silva",
      cpf: "12345678901",
      funcao: "Analista de RH",
      setor: "Recursos Humanos",
      dataAdmissao: "2023-01-15T08:00:00.000Z",
      dataDemissao: null,
      companyId: 1
    },
    {
      matricula: "1002",
      firstName: "Carlos",
      lastName: "Oliveira",
      cpf: "98765432100",
      funcao: "Desenvolvedor",
      setor: "TI",
      dataAdmissao: "2023-02-01T08:00:00.000Z",
      dataDemissao: null,
      companyId: 1
    }
  ];

  downloadTemplate(type: 'csv' | 'json') {
    if (type === 'json') {
      this.downloadJson();
    } else {
      this.downloadCsv();
    }
  }

  private downloadJson() {
    const data = { employees: this.SAMPLE_DATA };
    const jsonString = JSON.stringify(data, null, 2);
    this.triggerDownload(jsonString, 'modelo_importacao_funcionarios.json', 'application/json');
  }

  private downloadCsv() {
    const headers = ['matricula', 'firstName', 'lastName', 'cpf', 'funcao', 'setor', 'dataAdmissao', 'dataDemissao', 'companyId'];
    const csvRows = [];

    // Add Header
    csvRows.push(headers.join(','));

    // Add Data
    this.SAMPLE_DATA.forEach(row => {
      const values = headers.map(header => {
        const val = (row as any)[header] === null ? '' : (row as any)[header];
        return JSON.stringify(val); // Handles quoting
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    this.triggerDownload(csvString, 'modelo_importacao_funcionarios.csv', 'text/csv');
  }

  private triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
