// 小说作品相关类型定义

export enum WorkStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

// 作品实体（可按需扩展）
export interface Work {
  novelId: string;
  title: string;
  description?: string;
  status: WorkStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Outline {
  outlineId: string;
  novelId?: string;
  title?: string;
  summary?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Character {
  characterId: string;
  novelId?: string;
  name: string;
  role?: string;
  traits?: string[] | string;
  background?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface WorkDetailResponse {
  work: Work;
  outlines: Outline[];
  characters: Character[];
}

// 创建作品入参
export interface CreateWorkDto {
  title: string;
  description?: string;
  status?: WorkStatus;
}
