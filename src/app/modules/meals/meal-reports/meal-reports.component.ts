import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MealsService } from '../../../core/services/meals.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-meal-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold dark:text-gray-100">Relatórios de Refeições</h1>
          <p class="text-neutral-500 dark:text-neutral-400">Gestão de custos e consumo por setor</p>
        </div>
        
        <!-- Period Filter -->
        <mat-form-field appearance="outline" class="w-64 hide-subscript">
           <mat-label>Data Base (Vigência)</mat-label>
           <input matInput [matDatepicker]="picker" [formControl]="dateControl" (dateChange)="onDateChange()">
           <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
           <mat-datepicker #picker></mat-datepicker>
           <mat-hint class="dark:text-neutral-400">Período: {{ periodStart | date:'dd/MM/yyyy' }} a {{ periodEnd | date:'dd/MM/yyyy' }}</mat-hint>
        </mat-form-field>
      </div>

      <div class="p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden">
        <mat-tab-group animationDuration="0ms">
          <!-- Summary Tab -->
          <mat-tab label="Resumo Financeiro">
            <div class="p-6">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                   <div class="text-blue-600 dark:text-blue-400 font-medium mb-1">Total Refeições</div>
                   <div class="text-3xl font-bold text-blue-800 dark:text-blue-300">{{ summary?.totalQty || 0 }}</div>
                 </div>
                 <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-100 dark:border-green-900/30">
                   <div class="text-green-600 dark:text-green-400 font-medium mb-1">Custo Total (R$)</div>
                   <div class="text-3xl font-bold text-green-800 dark:text-green-300">{{ summary?.totalValue || 0 | currency:'BRL' }}</div>
                 </div>
               </div>

               <h3 class="font-bold text-lg mb-4 text-neutral-700 dark:text-neutral-300">Detalhamento por Setor (Semanas)</h3>
               
               <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
                  <thead class="text-xs text-neutral-700 dark:text-neutral-200 uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-4 py-3 border-b dark:border-gray-600">Setor</th>
                      <!-- Dynamic Weeks Headers -->
                      <th *ngFor="let week of matrix?.weeks" class="px-4 py-3 border-b dark:border-gray-600 text-center">
                        {{ week.label }}<br>
                        <span class="text-[10px] lowercase font-normal">{{ week.start | date:'dd/MM/yyyy' }} - {{ week.end | date:'dd/MM/yyyy' }}</span>
                      </th>
                      <th class="px-4 py-3 border-b dark:border-gray-600 text-right">Total Mês</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of matrix?.rows" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{{ row.sector }}</td>
                      
                      <!-- Weekly Counts -->
                      <td *ngFor="let count of row.weeklyCounts; let i = index" class="px-4 py-3 text-center">
                        <div class="flex flex-col items-center">
                            <span *ngIf="count > 0" class="font-semibold text-gray-900 dark:text-white">{{ count }}</span>
                            <span *ngIf="count > 0" class="text-xs text-gray-500 dark:text-gray-400">{{ row.weeklyValues[i] | currency:'BRL' }}</span>
                            <span *ngIf="count === 0" class="text-neutral-300 dark:text-neutral-600">-</span>
                        </div>
                      </td>

                      <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                        <div>{{ row.totalQty }}</div>
                        <div class="text-xs text-green-600 dark:text-green-400">{{ row.totalValue | currency:'BRL' }}</div>
                      </td>
                    </tr>
                     <tr *ngIf="!matrix?.rows?.length">
                        <td [attr.colspan]="(matrix?.weeks?.length || 0) + 2" class="text-center py-8">
                           Nenhum dado encontrado neste período.
                        </td>
                     </tr>
                  </tbody>
                </table>
               </div>
            </div>
          </mat-tab>

          <!-- Daily Report Tab -->
          <mat-tab label="Relatório Diário">
             <div class="p-6">
                <!-- Legend info -->
                 <div class="mb-4 flex gap-4 text-xs text-neutral-500">
                    <span>* Exibindo apenas dias úteis (Segunda a Sábado)</span>
                    <span>* Feriados não são excluídos automaticamente</span>
                 </div>

                 <div class="overflow-x-auto max-w-full">
                  <table class="min-w-max w-full text-sm text-center text-neutral-600 dark:text-neutral-300 border-collapse">
                    <thead class="text-xs text-neutral-700 dark:text-neutral-200 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                      <tr>
                        <th class="px-3 py-3 border-b dark:border-gray-600 text-left sticky left-0 bg-gray-50 dark:bg-gray-700 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Setor</th>
                        <!-- Dynamic Days Headers -->
                        <th *ngFor="let day of dailyMatrix?.days" class="px-2 py-3 border-b dark:border-gray-600 min-w-[50px]">
                          {{ day.label }}
                        </th>
                        <th class="px-3 py-3 border-b dark:border-gray-600 text-right sticky right-0 bg-gray-50 dark:bg-gray-700 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of dailyMatrix?.rows" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td class="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 text-left sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            {{ row.sector }}
                        </td>
                        
                        <!-- Daily Counts -->
                        <td *ngFor="let count of row.dailyCounts" class="px-2 py-2 border-l border-neutral-100 dark:border-neutral-700">
                           <span *ngIf="count > 0" class="font-semibold text-gray-900 dark:text-white">{{ count }}</span>
                           <span *ngIf="count === 0" class="text-neutral-300 dark:text-neutral-700">-</span>
                        </td>

                        <td class="px-3 py-2 text-right font-bold text-gray-900 dark:text-white sticky right-0 bg-white dark:bg-gray-800 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {{ row.totalQty }}
                        </td>
                      </tr>
                      
                      <!-- Totals Footer -->
                      <tr *ngIf="dailyMatrix?.rows?.length" class="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-neutral-300 dark:border-neutral-600">
                          <td class="px-3 py-2 text-left sticky left-0 bg-gray-100 dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">TOTAL</td>
                          <td *ngFor="let total of dailyMatrix?.dailyTotals" class="px-2 py-2">
                              {{ total > 0 ? total : '-' }}
                          </td>
                          <td class="px-3 py-2 text-right sticky right-0 bg-gray-100 dark:bg-gray-900 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              {{ summary?.totalQty }}
                          </td>
                      </tr>

                      <tr *ngIf="!dailyMatrix?.rows?.length">
                          <td [attr.colspan]="(dailyMatrix?.days?.length || 0) + 2" class="text-center py-8">
                             Nenhum dado encontrado neste período.
                          </td>
                       </tr>
                    </tbody>
                  </table>
                 </div>
             </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .hide-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `]
})
export class MealReportsComponent implements OnInit {
  private mealsService = inject(MealsService);

  dateControl = new FormControl(new Date());

  periodStart = '';
  periodEnd = '';

  summary: any = {};
  matrix: any = { weeks: [], rows: [] };
  dailyMatrix: any = { days: [], rows: [] }; // New daily matrix

  ngOnInit() {
    this.refresh();
  }

  onDateChange() {
    this.refresh();
  }

  refresh() {
    let date = this.dateControl.value || new Date();
    // Normalize to 1st of month to ensure period consistency if user picks a date that shifts period
    // Requirement: "Selecionar um MÊS de referência"
    // So if user picks Jan 10, it implies "January View" -> Period Dec 26 - Jan 25.
    // If we rely on getPeriod(Jan 10) it returns Dec 26 - Jan 25.
    // If user picks Jan 30, it returns Jan 26 - Feb 25.
    // We need to enforce "Reference Month".
    // If user picks Jan 2024, they mean the period ENDING in Jan 2024? Or the main month?
    // "Regra de vigência obrigatória: 26 do mês anterior → 25 do mês atual"
    // So if Reference Month is JANUARY, Period is 26 DEC -> 25 JAN.
    // To ensure this, we pass a date <= 25th of that month to getPeriod.
    // Let's force date to 1st of the selected month.

    date = new Date(date.getFullYear(), date.getMonth(), 1);

    const period = this.mealsService.getPeriod(date);
    this.periodStart = period.start;
    this.periodEnd = period.end;

    forkJoin({
      summary: this.mealsService.getWeeklySummary(period.start, period.end),
      matrix: this.mealsService.getSectorWeeklyMatrix(period.start, period.end),
      dailyMatrix: this.mealsService.getDailySectorMatrixByMonth(date) // Pass date for same logic
    }).subscribe(data => {
      this.summary = data.summary;
      this.matrix = data.matrix;
      this.dailyMatrix = data.dailyMatrix;
    });
  }
}
