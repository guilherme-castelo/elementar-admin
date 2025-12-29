import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dominio-export',
  templateUrl: './dominio-export.component.html',
  styleUrls: ['./dominio-export.component.scss']
})
export class DominioExportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private baseUrl = environment.apiBaseUrl || '/api';

  configForm: FormGroup;
  exportForm: FormGroup;
  
  isLoadingConfig = false;
  isExporting = false;

  years: number[] = [];
  months = [
    { value: 1, label: '01 - Janeiro' },
    { value: 2, label: '02 - Fevereiro' },
    { value: 3, label: '03 - Março' },
    { value: 4, label: '04 - Abril' },
    { value: 5, label: '05 - Maio' },
    { value: 6, label: '06 - Junho' },
    { value: 7, label: '07 - Julho' },
    { value: 8, label: '08 - Agosto' },
    { value: 9, label: '09 - Setembro' },
    { value: 10, label: '10 - Outubro' },
    { value: 11, label: '11 - Novembro' },
    { value: 12, label: '12 - Dezembro' }
  ];

  constructor() {
    this.configForm = this.fb.group({
      dominioRubric: ['297', [Validators.required, Validators.maxLength(9), Validators.pattern(/^[0-9]+$/)]],
      dominioCode: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9]+$/)]]
    });

    const now = new Date();
    this.exportForm = this.fb.group({
      month: [now.getMonth() + 1, Validators.required], // +1 because getMonth is 0-indexed
      year: [now.getFullYear(), Validators.required]
    });

    // Generate years (Current - 5 to Current + 1)
    for (let i = now.getFullYear() - 5; i <= now.getFullYear() + 1; i++) {
      this.years.push(i);
    }
    // Descending
    this.years.reverse(); 
  }

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.isLoadingConfig = true;
    this.api.get<any>('/integrations/dominio/config').subscribe({
      next: (config) => {
        this.configForm.patchValue({
          dominioRubric: config.dominioRubric || '297',
          dominioCode: config.dominioCode || ''
        });
        this.isLoadingConfig = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingConfig = false;
        // Optionally show specific error for 403 or network
      }
    });
  }

  saveConfig() {
    if (this.configForm.invalid) return;

    this.isLoadingConfig = true;
    this.api.put('/integrations/dominio/config', this.configForm.value).subscribe({
      next: () => {
        this.snackBar.open('Configurações salvas com sucesso!', 'OK', { duration: 3000 });
        this.isLoadingConfig = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erro ao salvar configurações', 'Fechar', { duration: 5000 });
        this.isLoadingConfig = false;
      }
    });
  }

  exportFile() {
    if (this.exportForm.invalid) return;
    
    // Check if config is likely valid (soft check)
    if (!this.configForm.value.dominioCode) {
       this.snackBar.open('Configure o código da empresa antes de exportar.', 'Fechar', { duration: 5000 });
       return;
    }

    this.isExporting = true;
    const { month, year } = this.exportForm.value;

    const params = new HttpParams().set('month', month).set('year', year);

    this.http.get(`${this.baseUrl}/integrations/dominio/export`, { 
      params,
      responseType: 'text' 
    }).subscribe({
      next: (data: any) => {
        this.downloadFile(data, `dominio_${year}_${String(month).padStart(2,'0')}.txt`);
        this.isExporting = false;
        this.snackBar.open('Arquivo gerado com sucesso!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error(err);
        let msg = 'Erro ao gerar arquivo.';
        if (err.status === 404) msg = 'Não há registros de refeição para o período selecionado.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.isExporting = false;
      }
    });
  }

  private downloadFile(data: string, filename: string) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
