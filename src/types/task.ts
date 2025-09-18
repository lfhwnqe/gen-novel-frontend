// 生成任务相关类型定义

export const TASK_STATUSES = ["queued", "running", "success", "failed"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskItem {
  taskId: string;
  type: string;
  status: TaskStatus;
  prompt?: string;
  novelId?: string;
  createdAt: string;
  updatedAt: string;
  result?: unknown;
  error?: { message: string; stack?: string } | null;
}

export interface TaskListResponse {
  data: TaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
