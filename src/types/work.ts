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
  novelName?: string;
  name: string;
  role?: string;
  traits?: string[] | string;
  background?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CharacterRelationshipEdge {
  characterId: string;
  name?: string;
  relationType: string;
  pairKey?: string;
  characterAId?: string;
  characterBId?: string;
  novelId?: string;
}

export interface CharacterRelationshipCurrent {
  pairKey: string;
  characterAId: string;
  characterBId: string;
  relType?: string;
  sinceTs?: string;
  lastEventId?: string;
  novelId?: string;
  updatedAt?: string;
  createdAt?: string;
  ownerAId?: string;
  ownerBId?: string;
}

export interface CharacterRelationshipHistoryEvent {
  pairKey: string;
  eventId: string;
  characterAId: string;
  characterBId: string;
  prevRelType?: string;
  newRelType?: string;
  reason?: string;
  chapterId?: string;
  sceneId?: string;
  novelId?: string;
  novelName?: string;
  occurredAt?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  ownerAId?: string;
  ownerBId?: string;
  notes?: string;
}

export interface WorkDetailResponse {
  work: Work;
}

// 创建作品入参
export interface CreateWorkDto {
  title: string;
  description?: string;
  status?: WorkStatus;
}

export enum TaskType {
  SCENARIO_OUTLINE = "scenario-outline",
  WORLDBUILDING = "worldbuilding",
}
