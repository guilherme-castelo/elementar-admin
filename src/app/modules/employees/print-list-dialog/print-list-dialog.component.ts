import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-print-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Imprimir Lista de Assinatura</h2>
    <mat-dialog-content class="pt-4">
      <p class="mb-4 text-neutral-500">
        Selecione a data que deve constar no cabeçalho da lista de assinatura.
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Data da Assinatura</mat-label>
        <input
          matInput
          [matDatepicker]="picker"
          [(ngModel)]="selectedDate"
          placeholder="Escolha uma data"
        />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onConfirm()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 400px;
      }
    `,
  ],
})
export class PrintListDialogComponent {
  private dialogRef = inject(MatDialogRef<PrintListDialogComponent>);
  selectedDate: Date = new Date();

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedDate);
  }
}
