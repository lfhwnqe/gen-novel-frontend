// 小说大纲相关类型定义

export enum OutlineStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export interface OutlineVersion {
  outlineId: string;
  novelId?: string;
  title?: string;
  summary?: string;
  content?: string;
  status: OutlineStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  sourceTaskId?: string;
}

export interface OutlineLatestVersions {
  draft: OutlineVersion | null;
  published: OutlineVersion | null;
}
