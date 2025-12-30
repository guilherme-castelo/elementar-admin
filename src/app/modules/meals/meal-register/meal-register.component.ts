import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MealsService } from '../../../core/services/meals.service';
import { EmployeesService } from '../../../core/services/employees.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IMeal } from '../../../core/models/meal.model';
import { IEmployee } from '../../../core/models/employee.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MealImportDialogComponent } from '../meal-import-dialog/meal-import-dialog.component';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-meal-register',
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
    MatSnackBarModule,
    MatTableModule,
    MatCardModule,
    MatDialogModule,
  ],
  template: `
    <div class="p-6 h-[calc(100vh-64px)] flex flex-col">
      <!-- Header / Controls -->
      <div
        class="p-4 rounded-lg shadow-sm border border-neutral-200 mb-4 flex flex-col md:flex-row items-center gap-4"
      >
        <!-- Date Picker (Fixed) -->
        <mat-form-field
          appearance="outline"
          class="w-full md:w-[200px] hide-subscript"
        >
          <mat-label>Data da Refeição</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            [formControl]="dateControl"
            (dateChange)="onDateChange()"
          />
          <mat-datepicker-toggle
            matIconSuffix
            [for]="picker"
          ></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <!-- Matricula Input (Focus Target) -->
        <mat-form-field
          appearance="outline"
          class="w-full flex-1 hide-subscript"
        >
          <mat-label>DIGITE A MATRÍCULA</mat-label>
          <input
            matInput
            #matriculaInput
            [formControl]="matriculaControl"
            (keydown.enter)="registerMeal()"
            placeholder="Ex: 1234"
            autocomplete="off"
          />
          <mat-icon matSuffix class="cursor-pointer" (click)="registerMeal()"
            >send</mat-icon
          >
        </mat-form-field>

        <button
          mat-stroked-button
          color="primary"
          class="h-[56px]"
          (click)="openImportDialog()"
          matTooltip="Importar Arquivo"
        >
          <mat-icon>upload</mat-icon> Importar
        </button>

        <button
          mat-stroked-button
          class="h-[56px] text-primary-700 border-primary-700"
          (click)="navigateToReports()"
          matTooltip="Visualizar Relatórios"
          *ngIf="permissionService.hasPermission('meal:read')"
        >
          <mat-icon>bar_chart</mat-icon> Relatórios
        </button>
      </div>

      <!-- Main Content / List -->
      <div
        class="flex-1 rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col"
      >
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 class="font-bold text-lg text-primary-700">Refeições do Dia</h2>
          <div class="flex gap-4 text-sm font-medium">
            <span class="text-neutral-600"
              >Qtd:
              <strong class="text-black">{{
                (meals$ | async)?.length || 0
              }}</strong></span
            >
            <span class="text-neutral-600"
              >Total:
              <strong class="text-green-600">{{
                ((meals$ | async)?.length || 0) * 3 | currency : 'BRL'
              }}</strong></span
            >
          </div>
        </div>

        <div class="overflow-auto flex-1">
          <table mat-table [dataSource]="(meals$ | async) || []" class="w-full">
            <!-- Time Column -->
            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef>Hora</th>
              <td mat-cell *matCellDef="let meal">
                {{ meal.createdAt | date : 'HH:mm' }}
              </td>
            </ng-container>

            <!-- Matricula Column -->
            <ng-container matColumnDef="matricula">
              <th mat-header-cell *matHeaderCellDef>Matrícula</th>
              <td mat-cell *matCellDef="let meal">
                <span class="font-mono bg-gray-400 px-2 py-1 rounded">
                  {{ meal.matriculaSnapshot || meal.employee?.matricula }}
                </span>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Funcionário</th>
              <td mat-cell *matCellDef="let meal">
                <div>
                  <div class="font-medium">
                    {{
                      meal.employeeNameSnapshot ||
                        (meal.employee
                          ? meal.employee.firstName +
                            ' ' +
                            meal.employee.lastName
                          : 'Sem Nome')
                    }}
                  </div>
                  <div class="text-xs text-neutral-500">
                    {{
                      meal.employeeSectorSnapshot ||
                        meal.employee?.setor ||
                        'Sem Setor'
                    }}
                  </div>
                </div>
              </td></ng-container
            >

            <!-- Cost Column -->
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let meal">
                {{ meal.price | currency : 'BRL' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let meal">
                <button
                  *ngIf="permissionService.hasPermission('meal:delete')"
                  mat-icon-button
                  color="warn"
                  (click)="deleteMeal(meal)"
                  title="Excluir refeição"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr
              mat-header-row
              *matHeaderRowDef="displayedColumns; sticky: true"
            ></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td
                class="mat-cell text-center py-10 text-neutral-400 italic"
                [attr.colspan]="displayedColumns.length"
              >
                Nenhuma refeição registrada nesta data.
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .hide-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    `,
  ],
})
export class MealRegisterComponent implements OnInit {
  private mealsService = inject(MealsService);
  private employeesService = inject(EmployeesService);
  public permissionService = inject(PermissionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @ViewChild('matriculaInput') matriculaInput!: ElementRef<HTMLInputElement>;

  dateControl = new FormControl(new Date());
  matriculaControl = new FormControl('');

  meals$!: Observable<IMeal[]>;
  allEmployees: IEmployee[] = [];

  displayedColumns = ['time', 'matricula', 'name', 'price', 'actions'];

  ngOnInit() {
    this.loadEmployees(); // Pre-load for fast validation
    this.loadMeals();
  }

  loadEmployees() {
    this.employeesService.getAll().subscribe((employees) => {
      this.allEmployees = employees;
    });
  }

  loadMeals() {
    const date = this.dateControl.value || new Date();
    // Use ISO string but strip time for robust filtering if needed,
    // but the service handles "date_like" or "date" match.
    // Ideally we pass local date string YYYY-MM-DD to service.
    // For now, passing full ISO from Date object.
    const isoDate = date.toISOString().split('T')[0];
    this.meals$ = this.mealsService.getDailyMeals(isoDate).pipe(
      map((meals) =>
        meals.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        })
      )
    );
  }

  onDateChange() {
    this.loadMeals();
    setTimeout(() => this.matriculaInput.nativeElement.focus(), 100);
  }

  registerMeal() {
    const matricula = this.matriculaControl.value?.trim();
    if (!matricula) return;

    // 1. Validate Employee Locally (Fast)
    const employee = this.allEmployees.find((e) => e.matricula === matricula);

    if (!employee) {
      this.showFeedback(
        `Funcionário não encontrado (Matrícula: ${matricula})`,
        'error'
      );
      this.clearInput();
      return;
    }

    if (employee.dataDemissao) {
      this.showFeedback(
        `Funcionário DEMITIDO. Refeição não permitida.`,
        'error'
      );
      this.clearInput();
      return;
    }

    // 2. Check Duplicate (Optimistic check via current list)
    // We subscribe to meals$ snapshot or rely on backend error if we had one.
    // Since meals$ is observable, we can scan it or trust the service/backend.
    // Let's do a simple check against the loaded list if we can.
    // But `meals$` is async. Let's just try to submit. The backend (JSON-SERVER) allows duplicates by default...
    // We MUST prevent checking locally first.
    // We can use `this.meals$` via async pipe in template, but here we need value.
    // Just fetch it or assume we trust the operator.
    // Better: let's verify against the list we displayed.
    // NOTE: This check depends on the list being up to date.

    // Check duplicates logic:
    // Ideally the backend rejects. JSON-SERVER doesn't enforce Unique.
    // So we check in the component before call.

    // We need the current value of meals.
    // Let's assume we can get it from a subscribe or store.
    // For MVP, lets just call register and handle success.
    // To properly prevent duplicates, we should check `this.meals$` if we keep a local subject, or fetch specific check.

    // Let's do a quick verify against the backend "getDailyMeals" or keep a local BehaviorSubject.
    // Refactor meals$ to be a Subject for easier access?
    // Or just simple:

    const date = this.dateControl.value || new Date();
    const isoDate = date.toISOString().split('T')[0]; // Current Day YYYY-MM-DD

    // 3. Register
    // 3. Register
    // Rely on Backend for definitive validation (Atomic)
    // The previous client-side check was good for UX but backend is authoritative.
    // We catch the specific error from backend.

    this.mealsService.registerTx(date.toISOString(), employee).subscribe({
      next: (meal) => {
        this.showFeedback(
          `Refeição registrada: ${employee.firstName}`,
          'success'
        );
        this.loadMeals();
        this.clearInput();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao registrar refeição.';
        this.showFeedback(msg, 'error');
        this.clearInput();
      },
    });
  }

  deleteMeal(meal: IMeal) {
    if (!this.permissionService.hasPermission('meal:delete')) return;

    const name =
      meal.employeeNameSnapshot ||
      (meal.employee
        ? `${meal.employee.firstName} ${meal.employee.lastName}`
        : 'Sem Nome');

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Excluir Refeição',
        message: `Deseja realmente excluir a refeição de ${name}?`,
        confirmText: 'Excluir',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.mealsService.delete(meal.id).subscribe({
          next: () => {
            this.showFeedback('Refeição excluída com sucesso', 'success');
            this.loadMeals();
          },
          error: () => this.showFeedback('Erro ao excluir refeição', 'error'),
        });
      }
    });
  }

  private clearInput() {
    this.matriculaControl.setValue('');
    this.matriculaInput.nativeElement.focus();
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'FECHAR', {
      duration: type === 'error' ? 5000 : 2000,
      panelClass:
        type === 'error'
          ? ['bg-red-600', 'text-white']
          : ['bg-green-600', 'text-white'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(MealImportDialogComponent, {
      width: '800px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.showFeedback('Importação realizada com sucesso!', 'success');
        this.loadMeals();
      }
    });
  }

  navigateToReports() {
    this.router.navigate(['/meals/reports']);
  }
}
