import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface MoveMealsDialogData {
  count: number;
}

@Component({
  selector: 'app-move-meals-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title class="font-bold text-primary-700">Mover Refeições</h2>
    <mat-dialog-content class="flex flex-col gap-4 min-w-[280px]">
      <p class="text-neutral-600 mb-2">
        Selecione o novo dia para mover as <strong>{{ data.count }}</strong> refeições selecionadas.
      </p>
      
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Nova Data</mat-label>
        <input
          matInput
          [matDatepicker]="picker"
          [formControl]="dateControl"
          required
        />
        <mat-datepicker-toggle
          matIconSuffix
          [for]="picker"
        ></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="dateControl.invalid"
        (click)="onConfirm()"
      >
        Mover
      </button>
    </mat-dialog-actions>
  `,
})
export class MoveMealsDialogComponent {
  public dialogRef = inject(MatDialogRef<MoveMealsDialogComponent>);
  public data = inject<MoveMealsDialogData>(MAT_DIALOG_DATA);
  
  dateControl = new FormControl<Date | null>(null, Validators.required);

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.dateControl.valid && this.dateControl.value) {
      this.dialogRef.close(this.dateControl.value);
    }
  }
}
