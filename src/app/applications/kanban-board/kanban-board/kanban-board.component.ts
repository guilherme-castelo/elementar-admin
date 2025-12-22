import { Component, inject, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KanbanColumn, KanbanItem, KanbanItemDefDirective, KanbanBoardComponent as EmrKanbanBoardComponent } from '@elementar-ui/components/kanban-board';
import { PanelBodyComponent, PanelComponent, PanelHeaderComponent } from '@elementar-ui/components/panel';
import {
  AvatarComponent,
  AvatarGroupComponent,
  AvatarTotalComponent,
  DicebearComponent
} from '@elementar-ui/components/avatar';
import { SegmentedButtonComponent, SegmentedComponent } from '@elementar-ui/components/segmented';
import { TasksService } from '../../../core/services/tasks.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.interface';
import { TaskDialogComponent } from '../../task-dialog/task-dialog.component';

interface KanbanTask extends KanbanItem {
  id: string;
  priorityColor: string;
  assigneeId: string;
  originalTask: Task;
}

@Component({
  selector: 'app-kanban-board',
  imports: [
    MatIcon,
    MatIconButton,
    PanelComponent,
    PanelHeaderComponent,
    PanelBodyComponent,
    AvatarComponent,
    AvatarGroupComponent,
    AvatarTotalComponent,
    MatButton,
    SegmentedButtonComponent,
    SegmentedComponent,
    KanbanItemDefDirective,
    DicebearComponent,
    EmrKanbanBoardComponent
  ],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements OnInit {
  private _tasksService = inject(TasksService);
  private _authService = inject(AuthService);
  private _dialog = inject(MatDialog);

  columns: KanbanColumn<KanbanTask>[] = [
    { id: 1, name: 'To Do', color: '#06b6d4', items: [] },
    { id: 2, name: 'In Progress', color: '#a855f7', items: [] },
    { id: 3, name: 'Done', color: '#22c55e', items: [] }
  ];

  ngOnInit() {
    this.refreshTasks();
  }

  refreshTasks() {
    this._tasksService.getTasks().subscribe(tasks => {
      // Logic for filtering is handled in mapping or here.
      // Since mapTasksToColumns clears and refills columns, we can just use the mapping logic.
      // But we need to ensure we don't duplicate logic.
      const user = this._authService.getUser();
      const userId = user ? user.id : null;

      const filteredTasks = tasks.filter(t =>
        t.isPublic ||
        (userId && (t.ownerUserId == userId || t.collaboratorUserIds.includes(userId)))
      );

      this.mapTasksToColumns(filteredTasks);
    });
  }

  mapTasksToColumns(tasks: Task[]) {
    const mapToKanban = (t: Task, idx: number): KanbanTask => ({
      id: t.id,
      name: t.title,
      position: idx,
      priorityColor: this.getPriorityColor(t.priority),
      assigneeId: t.ownerUserId.toString(),
      originalTask: t
    });

    // We can't just blindly push if we want to preserve local drag state before sync?
    // Actually, reactive sync is better. If backend updates, we reflect.
    // So we clear and refill.

    this.columns[0].items = tasks
      .filter(t => t.status === 'todo')
      .map(mapToKanban);

    this.columns[1].items = tasks
      .filter(t => t.status === 'doing')
      .map(mapToKanban);

    this.columns[2].items = tasks
      .filter(t => t.status === 'done')
      .map(mapToKanban);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#22a06b';
      case 'low': return '#e2b203';
      default: return '#ccc';
    }
  }

  openTaskDialog(task?: Task) {
    this._dialog.open(TaskDialogComponent, {
      width: '600px',
      data: task || null
    });
  }

  // Bind this in HTML: (itemDropped)="onItemDropped($event)"
  // Assuming emr-kanban-board emits this event with CdkDragDrop<KanbanItem[]> logic
  onItemDropped(event: CdkDragDrop<KanbanTask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Determine new status based on container id or related column
      const item = event.container.data[event.currentIndex];
      // We need to find which column corresponds to event.container
      // Actually, standard CDK way is container.id (if set) or data.
      // Let's deduce status from the column this list belongs to.
      // Hack: we know the structure.

      let newStatus: 'todo' | 'doing' | 'done' = 'todo';
      if (this.columns[1].items.includes(item)) newStatus = 'doing';
      if (this.columns[2].items.includes(item)) newStatus = 'done';

      const updatedTask = { ...item.originalTask, status: newStatus };
      this._tasksService.updateTask(updatedTask).subscribe();
    }
  }
}
