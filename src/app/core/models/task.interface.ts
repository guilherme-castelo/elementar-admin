export interface TaskComment {
  text: string;
  userId: number | string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  isPublic: boolean;
  ownerUserId: number | string;
  collaboratorUserIds: (number | string)[];
  priority: 'low' | 'medium' | 'high';
  comments: TaskComment[];
  createdAt: string;
  completedAt?: string;
}
