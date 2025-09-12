// 共享的产品相关类型定义
// 与后端 DTO 保持一致

export enum ProductType {
  WEALTH = "理财",
  FUND = "基金",
  BOND = "债券",
  INSURANCE = "保险",
}

// 风险等级（中文值，保持与表单一致）
export enum RiskLevel {
  LOW = "低",
  MEDIUM = "中",
  HIGH = "高",
}

// 产品状态（若后端扩展可在此补充）
export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

// 产品实体（用于表格）
export interface Product {
  productId: string;
  productName: string;
  productType: ProductType;
  description?: string;
  riskLevel: RiskLevel;
  minInvestment: number;
  maxInvestment: number;
  expectedReturn: number;
  interestPaymentDate: string;
  maturityPeriod: number;
  status: ProductStatus | string;
  salesStartDate: string;
  salesEndDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
