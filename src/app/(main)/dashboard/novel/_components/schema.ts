import { z } from "zod";

// 客户状态枚举
export const CustomerStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

// 身份证件类型枚举
export const IdType = {
  ID_CARD: "身份证",
  PASSPORT: "护照",
  OTHER: "其他",
} as const;

// 风险承受等级枚举
export const RiskLevel = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
} as const;

// 客户数据schema
export const customerSchema = z.object({
  customerId: z.string(),
  email: z.string(),
  phone: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  idType: z.nativeEnum(IdType),
  idNumber: z.string(),
  dateOfBirth: z.string(),
  address: z.string(),
  riskLevel: z.nativeEnum(RiskLevel),
  status: z.nativeEnum(CustomerStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
  remarks: z.string().optional(),
  wechatId: z.string().optional(),
});

// 保留原有的section schema以防其他地方使用
export const sectionSchema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;
