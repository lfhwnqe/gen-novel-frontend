// 小说作品相关类型定义

export enum WorkStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

// 作品实体（可按需扩展）
export interface Work {
  workId?: string;
  title: string;
  description?: string;
  status: WorkStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// 创建作品入参
export interface CreateWorkDto {
  title: string;
  description?: string;
  status?: WorkStatus;
}
