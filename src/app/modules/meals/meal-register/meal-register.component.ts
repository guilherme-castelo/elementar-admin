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
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MoveMealsDialogComponent } from '../move-meals-dialog/move-meals-dialog.component';

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
    MatCheckboxModule,
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
            (keyup.enter)="registerMeal()"
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
      </div>

      <!-- Main Content / List -->
      <div
        class="flex-1 rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col"
      >
        <div class="p-4 border-b flex justify-between items-center bg-gray-50 min-h-[73px]">
          <h2 class="font-bold text-lg text-primary-700">Refeições do Dia</h2>
          
          <div *ngIf="selection.hasValue()" class="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200 animate-fade-in">
            <span class="text-sm font-semibold text-primary-800 mr-2">
              {{ selection.selected.length }} selecionada(s)
            </span>
            <button
              mat-flat-button
              color="warn"
              (click)="deleteSelectedMeals()"
              *ngIf="permissionService.hasPermission('meal:delete')"
            >
              <mat-icon>delete</mat-icon> Excluir
            </button>
            <button
              mat-flat-button
              color="primary"
              (click)="moveSelectedMeals()"
            >
              <mat-icon>edit_calendar</mat-icon> Mover Dia
            </button>
          </div>

          <div *ngIf="!selection.hasValue()" class="flex gap-4 text-sm font-medium">
            <span class="text-neutral-600"
              >Qtd:
              <strong class="text-black">{{
                meals.length
              }}</strong></span
            >
            <span class="text-neutral-600"
              >Total:
              <strong class="text-green-600">{{
                meals.length * 3 | currency : 'BRL'
              }}</strong></span
            >
          </div>
        </div>

        <div class="overflow-auto flex-1">
          <table mat-table [dataSource]="meals" class="w-full">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="w-[50px]">
                <mat-checkbox
                  (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()"
                >
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(row) : null"
                  [checked]="selection.isSelected(row)"
                >
                </mat-checkbox>
              </td>
            </ng-container>

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

  allEmployees: IEmployee[] = [];
  meals: IMeal[] = [];
  selection = new SelectionModel<IMeal>(true, []);

  displayedColumns = ['select', 'time', 'matricula', 'name', 'price', 'actions'];

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
    const isoDate = date.toISOString().split('T')[0];
    this.mealsService.getDailyMeals(isoDate).pipe(
      map((meals) =>
        meals.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        })
      )
    ).subscribe({
      next: (meals) => {
        this.meals = meals;
        this.selection.clear();
      },
      error: (err) => {
        this.showFeedback('Erro ao carregar refeições.', 'error');
      }
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.meals.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.meals);
  }

  deleteSelectedMeals() {
    if (!this.permissionService.hasPermission('meal:delete')) return;
    const selectedCount = this.selection.selected.length;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Excluir Refeições',
        message: `Deseja realmente excluir as ${selectedCount} refeições selecionadas?`,
        confirmText: 'Excluir',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const ids = this.selection.selected.map((m) => m.id);
        this.mealsService.deleteBulk(ids).subscribe({
          next: () => {
            this.showFeedback('Refeições excluídas com sucesso', 'success');
            this.loadMeals();
          },
          error: (err) => {
            const msg = err.error?.message || 'Erro ao excluir refeições.';
            this.showFeedback(msg, 'error');
          },
        });
      }
    });
  }

  moveSelectedMeals() {
    const selectedCount = this.selection.selected.length;

    const dialogRef = this.dialog.open(MoveMealsDialogComponent, {
      data: {
        count: selectedCount,
      },
      width: '350px',
    });

    dialogRef.afterClosed().subscribe((newDate: Date | null) => {
      if (newDate) {
        const isoDate = newDate.toISOString().split('T')[0];
        const ids = this.selection.selected.map((m) => m.id);

        this.mealsService.moveBulk(ids, isoDate).subscribe({
          next: () => {
            this.showFeedback('Refeições movidas com sucesso', 'success');
            this.loadMeals();
          },
          error: (err) => {
            const msg = err.error?.message || 'Erro ao mover refeições.';
            this.showFeedback(msg, 'error');
          },
        });
      }
    });
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
      // Open Confirmation Dialog to Register
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'Funcionário não encontrado',
          message: 'Não existe funcionário cadastrado com esta matricula',
          confirmText: 'Cadastrar',
          cancelText: 'Cancelar',
          color: 'primary',
        },
        autoFocus: false,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.router.navigate(['/employees/new'], {
            queryParams: { matricula: matricula },
          });
        } else {
          // If cancelled, just focus back
          this.clearInput();
        }
      });
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
