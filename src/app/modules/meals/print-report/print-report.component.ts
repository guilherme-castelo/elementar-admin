import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintService } from '../../../core/services/print.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-print-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-container" *ngIf="data">
      <!-- Print Header -->
      <header class="print-header">
        <div class="company-info">
          <h1>{{ data.companyName || 'Relatório Elementar' }}</h1>
          <p>Gerado em: {{ printDate | date : 'dd/MM/yyyy HH:mm' }}</p>
        </div>
        <div class="report-info">
          <h2>{{ data.title }}</h2>
          <p class="period">
            Período: {{ data.periodStart | date : 'dd/MM/yyyy' }} a
            {{ data.periodEnd | date : 'dd/MM/yyyy' }}
          </p>
        </div>
      </header>

      <!-- Dynamic Content Based on Report Type -->
      <main class="print-content">
        <!-- Weekly Summary Table -->
        <div *ngIf="data.type === 'weekly'" class="report-section">
          <h3>Resumo por Setor</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th>Setor</th>
                <th *ngFor="let week of data.matrix.weeks" class="text-center">
                  {{ week.label }}<br />
                  <small
                    >{{ week.start | date : 'dd/MM' }} -
                    {{ week.end | date : 'dd/MM' }}</small
                  >
                </th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of data.matrix.rows">
                <td>{{ row.sector }}</td>
                <td
                  *ngFor="let count of row.weeklyCounts; let i = index"
                  class="text-center"
                >
                  <div *ngIf="count > 0">
                    <strong>{{ count }}</strong>
                    <br /><small>{{
                      row.weeklyValues[i] | currency : 'BRL'
                    }}</small>
                  </div>
                  <span *ngIf="count === 0">-</span>
                </td>
                <td class="text-right">
                  <strong>{{ row.totalQty }}</strong>
                  <br /><small>{{ row.totalValue | currency : 'BRL' }}</small>
                </td>
              </tr>
              <!-- Totals Footer for Weekly -->
              <tr class="totals-row">
                <td>TOTAL</td>
                <td
                  *ngFor="let week of data.matrix.weeks; let i = index"
                  class="text-center"
                >
                  <!-- Ideally calculate column totals here or pass pre-calculated -->
                  -
                </td>
                <td class="text-right">
                  <strong>{{ data.summary.totalQty }}</strong>
                  <br /><small>{{
                    data.summary.totalValue | currency : 'BRL'
                  }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Daily Report Table -->
        <div *ngIf="data.type === 'daily'" class="report-section">
          <h3>
            Detalhamento Diário ({{
              data.viewMode === 'sector' ? 'Por Setor' : 'Por Funcionário'
            }})
          </h3>

          <table class="print-table">
            <thead>
              <tr>
                <th class="text-left">
                  {{ data.viewMode === 'sector' ? 'Setor' : 'Funcionário' }}
                </th>
                <th
                  *ngFor="let day of data.dailyMatrix.days"
                  class="text-center min-w-[30px]"
                >
                  {{ day.label }}
                </th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of data.rows">
                <td>
                  {{ row.label }}
                  <span *ngIf="row.secondaryLabel" class="sub-label"
                    >({{ row.secondaryLabel }})</span
                  >
                </td>
                <td *ngFor="let count of row.dailyCounts" class="text-center">
                  {{ count > 0 ? count : '-' }}
                </td>
                <td class="text-right font-bold">{{ row.totalQty }}</td>
              </tr>
              <tr class="totals-row">
                <td>TOTAL</td>
                <td
                  *ngFor="let total of data.dailyMatrix.dailyTotals"
                  class="text-center"
                >
                  {{ total > 0 ? total : '-' }}
                </td>
                <td class="text-right">{{ data.summary.totalQty }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Single Day List Report -->
        <div *ngIf="data.type === 'daily-list'" class="report-section">
          <h3>Detalhamento Nominal ({{ data.rows.length }} registros)</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th class="text-left">Funcionário</th>
                <th class="text-left">Setor</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of data.rows">
                <td>
                  {{ row.employeeNameSnapshot || row.employee?.firstName }}
                  {{ row.employee?.lastName || '' }} <br /><small
                    class="text-gray-500"
                    >{{
                      row.matriculaSnapshot || row.employee?.matricula
                    }}</small
                  >
                </td>
                <td>{{ row.employeeSectorSnapshot || row.employee?.setor }}</td>
                <td class="text-right">
                  {{ row.price || 3.0 | currency : 'BRL' }}
                </td>
              </tr>
              <tr class="totals-row">
                <td colspan="2" class="text-right">TOTAL</td>
                <td class="text-right">
                  {{ data.summary.totalValue | currency : 'BRL' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <footer class="print-footer">
        <p>Sistema Elementar - Gestão de Refeições</p>
      </footer>
    </div>

    <!-- Error/No Data State -->
    <div *ngIf="!data" class="no-data">
      <p>Nenhum dado para impressão. Volte e tente novamente.</p>
    </div>
  `,
  styles: [
    `
      @media print {
        @page {
          size: auto;
          margin: 10mm;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      .print-container {
        font-family: 'Inter', sans-serif;
        color: #000;
        max-width: 100%;
        background: white;
        padding: 20px;
      }

      .print-header {
        display: flex;
        justify-content: space-between;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }

      .print-header h1 {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .print-header h2 {
        font-size: 18px;
        margin: 0 0 5px 0;
      }
      .print-header p {
        font-size: 12px;
        color: #555;
        margin: 0;
      }

      .print-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .print-table th,
      .print-table td {
        border: 1px solid #ddd;
        padding: 6px;
      }

      .print-table th {
        background-color: #f0f0f0;
        font-weight: bold;
      }

      .totals-row {
        background-color: #e0e0e0;
        font-weight: bold;
      }

      .text-center {
        text-align: center;
      }
      .text-right {
        text-align: right;
      }
      .text-left {
        text-align: left;
      }

      .sub-label {
        font-size: 10px;
        color: #666;
        margin-left: 5px;
      }

      .print-footer {
        margin-top: 30px;
        border-top: 1px solid #ccc;
        padding-top: 10px;
        text-align: center;
        font-size: 10px;
        color: #888;
      }

      .no-data {
        padding: 50px;
        text-align: center;
        font-size: 18px;
      }
    `,
  ],
})
export class PrintReportComponent implements OnInit {
  private printService = inject(PrintService);
  private router = inject(Router);

  data: any = null;
  printDate = new Date();

  ngOnInit() {
    this.data = this.printService.getPrintData();

    if (this.data) {
      // Small delay to ensure render before print
      setTimeout(() => {
        window.print();
        // Optional: window.close() after print, but depending on browser behavior it might close before printing or stay open.
        // Safer to let user close or stick to print dialog.
      }, 500);
    }
  }
}
