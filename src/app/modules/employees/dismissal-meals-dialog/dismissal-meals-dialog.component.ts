import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface DismissalMealsDialogData {
  count: number;
}

export type DismissalAction = 'DELETE' | 'UNLINK' | 'UNLINK_IGNORE';

@Component({
  selector: 'app-dismissal-meals-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2 text-amber-600">
      <mat-icon>warning</mat-icon>
      Atenção: Refeições Vinculadas
    </h2>
    <mat-dialog-content class="mat-typography max-w-[600px]">
      <p class="mb-4 text-lg">
        Este funcionário possui
        <strong class="text-red-600">{{ data.count }}</strong> registros de
        refeição vinculados.
      </p>
      <p class="mb-6 text-neutral-600">
        Para prosseguir com a demissão, você deve decidir o que fazer com estes
        registros.
      </p>

      <div class="grid gap-3">
        <!-- Option 1: Unlink & Ignore (Recommended for Dismissal/Payroll) -->
        <button
          mat-stroked-button
          class="!justify-start !py-6 !h-auto"
          (click)="select('UNLINK_IGNORE')"
        >
          <div class="flex items-center text-left">
            <mat-icon class="mr-3 text-amber-500">visibility_off</mat-icon>
            <div>
              <div class="font-bold">Desvincular e Ignorar na Exportação</div>
              <div class="text-xs text-neutral-500">
                Mantém o histórico, mas remove da folha de pagamento
                atual/futura.
              </div>
            </div>
          </div>
        </button>

        <!-- Option 2: Unlink Only -->
        <button
          mat-stroked-button
          class="!justify-start !py-6 !h-auto"
          (click)="select('UNLINK')"
        >
          <div class="flex items-center text-left">
            <mat-icon class="mr-3 text-blue-500">link_off</mat-icon>
            <div>
              <div class="font-bold">Apenas Desvincular</div>
              <div class="text-xs text-neutral-500">
                Os registros ficarão como "Pendentes". Incluídos na exportação
                se não tratados.
              </div>
            </div>
          </div>
        </button>

        <!-- Option 3: Delete (Destructive) -->
        <button
          mat-stroked-button
          color="warn"
          class="!justify-start !py-6 !h-auto"
          (click)="select('DELETE')"
        >
          <div class="flex items-center text-left">
            <mat-icon class="mr-3">delete_forever</mat-icon>
            <div>
              <div class="font-bold">Excluir Registros</div>
              <div class="text-xs text-neutral-500">
                Exclui permanentemente todas as refeições deste funcionário.
                Irreversível.
              </div>
            </div>
          </div>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="mt-4">
      <button mat-button (click)="close()">Cancelar</button>
    </mat-dialog-actions>
  `,
})
export class DismissalMealsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DismissalMealsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DismissalMealsDialogData,
    private dialog: MatDialog
  ) {}

  select(action: DismissalAction) {
    if (action === 'DELETE') {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'Confirmar Exclusão',
          message:
            'ATENÇÃO: Você escolheu EXCLUIR PERMANENTEMENTE os registros. Esta ação não pode ser desfeita. Tem certeza?',
          confirmText: 'Excluir',
          color: 'warn',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.dialogRef.close(action);
        }
      });
    } else {
      this.dialogRef.close(action);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
