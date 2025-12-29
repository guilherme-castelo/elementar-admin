import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MealImportTemplateService {

  private readonly SAMPLE_DATA = [
    {
      matricula: "1001",
      dataRefeicao: "2023-12-01T12:00:00.000Z",
      valor: 3.00
    },
    {
      matricula: "1002",
      dataRefeicao: "2023-12-01T12:30:00.000Z",
      valor: 3.00
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
    const data = this.SAMPLE_DATA;
    const jsonString = JSON.stringify(data, null, 2);
    this.triggerDownload(jsonString, 'modelo_importacao_refeicoes.json', 'application/json');
  }

  private downloadCsv() {
    const headers = ['matricula', 'dataRefeicao', 'valor'];
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
    this.triggerDownload(csvString, 'modelo_importacao_refeicoes.csv', 'text/csv');
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
