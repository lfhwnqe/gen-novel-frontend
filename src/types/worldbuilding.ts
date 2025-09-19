// 小说世界观相关类型定义

export enum WorldbuildingStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export interface Worldbuilding {
  worldbuildingId: string;
  novelId?: string;
  title?: string;
  summary?: string;
  content: string;
  status: WorldbuildingStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  sourceTaskId?: string;
}

export interface WorldbuildingLatestVersions {
  draft: Worldbuilding | null;
  published: Worldbuilding | null;
}
