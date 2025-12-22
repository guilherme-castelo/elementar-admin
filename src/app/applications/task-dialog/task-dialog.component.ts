import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { Task } from '../../core/models/task.interface';
import { TasksService } from '../../core/services/tasks.service';
import { UserService, User } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { CommentsService } from '../../core/services/comments.service';
import { Comment } from '../../core/models/comment.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTabsModule,
    MatListModule
  ]
})
export class TaskDialogComponent implements OnInit {
  form: FormGroup;
  users: User[] = [];
  isEditMode = false;

  private _fb = inject(FormBuilder);
  private _dialogRef = inject(MatDialogRef<TaskDialogComponent>);
  private _tasksService = inject(TasksService);
  private _userService = inject(UserService);
  private _authService = inject(AuthService);
  private _commentsService = inject(CommentsService);

  comments: Comment[] = [];
  newCommentControl = this._fb.control('', Validators.required);
  canComment = false;

  selectedTabIndex = 0;

  task: Task | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: Task | { task: Task | null, initialTabIndex?: number }) {
    const taskData = (dialogData && 'task' in dialogData) ? (dialogData as any).task : dialogData;
    this.selectedTabIndex = (dialogData && 'initialTabIndex' in dialogData) ? (dialogData as any).initialTabIndex : 0;

    this.isEditMode = !!taskData;
    this.form = this._fb.group({
      title: [taskData?.title || '', Validators.required],
      description: [taskData?.description || ''],
      priority: [taskData?.priority || 'medium', Validators.required],
      isPublic: [taskData?.isPublic ?? true], // Default to public
      collaboratorUserIds: [taskData?.collaboratorUserIds || []]
    });

    // Normalize data property to be just the task for internal usage
    this.task = taskData;
  }

  ngOnInit() {
    this._userService.getUsers().subscribe(users => {
      this.users = users;
    });

    if (this.isEditMode && this.task) {
      this.checkPermissions();
      this.loadComments();
    }
  }

  checkPermissions() {
    const user = this._authService.getUser();
    if (!user || !this.task) return;

    if (this.task.isPublic) {
      this.canComment = true;
    } else {
      const isOwner = this.task.ownerUserId === user.id;
      const isCollaborator = this.task.collaboratorUserIds.includes(user.id);
      this.canComment = isOwner || isCollaborator;
    }
  }

  loadComments() {
    if (!this.task) return;
    this._commentsService.getComments(this.task.id).subscribe(comments => {
      this.comments = comments;
    });
  }

  addComment() {
    if (this.newCommentControl.invalid || !this.canComment || !this.task) return;

    const user = this._authService.getUser();
    if (!user) return;

    const newComment: Omit<Comment, 'id'> = {
      taskId: this.task.id,
      authorId: user.id,
      authorName: user.name,
      content: this.newCommentControl.value!,
      createdAt: new Date().toISOString()
    };

    this._commentsService.addComment(newComment).subscribe(() => {
      this.newCommentControl.reset();
      this.loadComments();
    });
  }

  delete() {
    if (!this.task?.id) return;

    if (confirm('Are you sure you want to delete this task?')) {
      this._tasksService.deleteTask(this.task.id).subscribe({
        next: () => this._dialogRef.close(true),
        error: (err) => console.error(err)
      });
    }
  }

  save() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const currentUser = this._authService.getUser();

    if (!currentUser) {
      console.error('User not logged in');
      return;
    }

    if (this.isEditMode && this.task) {
      const updatedTask: Task = {
        ...this.task,
        ...formValue,
        // Ensure we don't overwrite owner unless intended. Usually owner doesn't change on edit.
        ownerUserId: this.task.ownerUserId,
        collaboratorUserIds: formValue.collaboratorUserIds
      };

      this._tasksService.updateTask(updatedTask).subscribe({
        next: (result) => this._dialogRef.close(result),
        error: (err) => console.error(err)
      });
    } else {
      const newTask: Omit<Task, 'id'> = {
        title: formValue.title,
        description: formValue.description,
        status: 'todo', // Default status for new tasks
        isPublic: formValue.isPublic,
        ownerUserId: currentUser.id,
        collaboratorUserIds: formValue.collaboratorUserIds,
        priority: formValue.priority,
        comments: [], // Initialize empty
        createdAt: new Date().toISOString()
      };

      this._tasksService.createTask(newTask).subscribe({
        next: (result) => this._dialogRef.close(result),
        error: (err) => console.error(err)
      });
    }
  }

  close() {
    this._dialogRef.close();
  }
}
