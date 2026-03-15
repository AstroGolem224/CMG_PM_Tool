/** Core project entity */
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  columns?: Column[];
}

/** Kanban column within a project */
export interface Column {
  id: string;
  project_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
  tasks?: Task[];
}

/** Task priority levels */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/** Task entity */
export interface Task {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: Priority;
  position: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  labels?: Label[];
  comments?: Comment[];
}

/** Label for categorizing tasks */
export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

/** Comment on a task */
export interface Comment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/** Dashboard aggregate statistics */
export interface DashboardStats {
  total_tasks: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

/** Upcoming deadline item */
export interface DeadlineItem {
  task_id: string;
  task_title: string;
  project_id: string;
  project_name: string;
  deadline: string;
  priority: Priority;
}

/** Activity feed item */
export interface ActivityItem {
  id: string;
  action: string;
  task_title: string;
  project_name: string;
  timestamp: string;
}

/** Payload for creating a task */
export interface CreateTaskPayload {
  project_id: string;
  column_id: string;
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string | null;
}

/** Payload for updating a task */
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: Priority;
  deadline?: string | null;
}

/** Payload for moving a task between columns */
export interface MoveTaskPayload {
  column_id: string;
  position: number;
}

/** Payload for creating a project */
export interface CreateProjectPayload {
  name: string;
  description?: string;
  color?: string;
}

/** Payload for updating a project */
export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  color?: string;
}

/** Payload for creating a label */
export interface CreateLabelPayload {
  project_id: string;
  name: string;
  color: string;
}

/** Payload for creating a comment */
export interface CreateCommentPayload {
  task_id: string;
  content: string;
}
