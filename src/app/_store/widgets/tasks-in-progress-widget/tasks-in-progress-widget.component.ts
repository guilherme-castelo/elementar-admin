import { Component, inject, input, OnInit } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AvatarComponent } from '@elementar-ui/components/avatar';
import { DASHBOARD, Dashboard, Widget } from '@elementar-ui/components/dashboard';
import { TasksService } from '../../../core/services/tasks.service';
import { Task } from '../../../core/models/task.interface';
import { TaskDialogComponent } from '../../../applications/task-dialog/task-dialog.component';

@Component({
  selector: 'emr-tasks-in-progress-widget',
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    AvatarComponent,
    MatPaginatorModule
  ],
  templateUrl: './tasks-in-progress-widget.component.html',
  styleUrl: './tasks-in-progress-widget.component.scss'
})
export class TasksInProgressWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });
  private _tasksService = inject(TasksService);
  private _dialog = inject(MatDialog);

  widget = input<Widget>();
  tasks: Task[] = [];

  // Pagination
  length = 0;
  pageSize = 3;
  pageIndex = 0;

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }

    this.loadTasks();

    // Subscribe to refresh trigger without params (reload current page)
    this._tasksService.refresh$.subscribe(() => {
      this.loadTasks();
    });
  }

  loadTasks() {
    // getMyTasksPaginated uses 1-based page index for logic, but MatPaginator uses 0-based
    this._tasksService.getMyTasksPaginated(this.pageIndex + 1, this.pageSize).subscribe(res => {
      this.tasks = res.data;
      this.length = res.total;
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadTasks();
  }

  openTaskDialog(task?: Task, initialTabIndex?: number) {
    this._dialog.open(TaskDialogComponent, {
      width: '600px',
      data: { task: task || null, initialTabIndex }
    });
  }
}
