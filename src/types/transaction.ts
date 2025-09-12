// 交易相关类型定义（前端枚举，需与后端保持一致）

// 与后端保持一致的小写值
export enum TransactionType {
  PURCHASE = "purchase",
  REDEEM = "redeem",
}

export enum TransactionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
  OTHER = "other",
}

export interface CreateTransactionInput {
  customerId: string;
  productId: string;
  transactionType: TransactionType;
  quantity: number;
  unitPrice: number;
  totalAmount?: number;
  transactionStatus?: TransactionStatus;
  paymentMethod: PaymentMethod;
  expectedMaturityDate?: string;
  actualReturnRate?: number;
  notes?: string;
  completedAt?: string;
}

export interface Transaction extends CreateTransactionInput {
  transactionId: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  customerName?: string;
}
