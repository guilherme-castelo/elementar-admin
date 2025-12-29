import { Component, inject, input, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent } from '../../../applications/task-dialog/task-dialog.component';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { DASHBOARD, Dashboard, Widget, WidgetComponent } from '@elementar-ui/components/dashboard';
import { TasksService } from '../../../core/services/tasks.service';
import { Task } from '../../../core/models/task.interface';

import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'emr-todos-widget',
  imports: [
    CommonModule,
    MatButton,
    MatIcon,
    MatCell,
    MatCheckbox,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatRow,
    MatTable,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    MatTooltipModule
  ],
  templateUrl: './todos-widget.component.html',
  styleUrl: './todos-widget.component.scss'
})
export class TodosWidgetComponent implements WidgetComponent, OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });
  private _tasksService = inject(TasksService);
  private _dialog = inject(MatDialog);

  widget = input<Widget>();

  displayedColumns: string[] = ['drag', 'select', 'id', 'title', 'priority'];
  dataSource = new MatTableDataSource<Task>([]);
  selection = new SelectionModel<Task>(true, []);

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }
    this._tasksService.getPublicTasks().subscribe(tasks => {
      this.dataSource.data = tasks;
    });
  }

  openTaskDialog(task?: Task) {
    this._dialog.open(TaskDialogComponent, {
      width: '600px',
      data: task || null
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Task): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  drop(event: CdkDragDrop<Task[]>) {
    const data = this.dataSource.data;
    moveItemInArray(data, event.previousIndex, event.currentIndex);
    this.dataSource.data = data;
    // Note: Reordering public tasks isn't persisted to backend in this MVP as db.json doesn't store order explicitly
    // except array order, but TasksService re-fetches.
    // If we want persistence, we'd need to update the whole list.
  }
}
