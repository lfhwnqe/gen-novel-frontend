import { PaymentMethod, TransactionStatus, TransactionType } from "@/types/transaction";

// 通用中文标签映射（与后端枚举值保持一致）
export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  [TransactionType.PURCHASE]: "申购",
  [TransactionType.REDEEM]: "赎回",
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: "待处理",
  [TransactionStatus.CONFIRMED]: "已确认",
  [TransactionStatus.COMPLETED]: "已完成",
  [TransactionStatus.CANCELLED]: "已取消",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: "银行转账",
  [PaymentMethod.CARD]: "银行卡/信用卡",
  [PaymentMethod.OTHER]: "其他",
};

// Badge 元信息（颜色类 + 中文标签），供表格等场景复用
export const TRANSACTION_STATUS_BADGE: Record<TransactionStatus, { cls: string; label: string }> = {
  [TransactionStatus.PENDING]: {
    cls: "bg-gray-500/10 text-gray-600",
    label: TRANSACTION_STATUS_LABEL[TransactionStatus.PENDING],
  },
  [TransactionStatus.CONFIRMED]: {
    cls: "bg-indigo-500/10 text-indigo-600",
    label: TRANSACTION_STATUS_LABEL[TransactionStatus.CONFIRMED],
  },
  [TransactionStatus.COMPLETED]: {
    cls: "bg-blue-500/10 text-blue-600",
    label: TRANSACTION_STATUS_LABEL[TransactionStatus.COMPLETED],
  },
  [TransactionStatus.CANCELLED]: {
    cls: "bg-red-500/10 text-red-600",
    label: TRANSACTION_STATUS_LABEL[TransactionStatus.CANCELLED],
  },
};

// 安全转换工具（兼容未知/空值）
export const toTransactionTypeLabel = (value?: string | null): string => {
  if (!value) return "-";
  return (TRANSACTION_TYPE_LABEL as Record<string, string>)[value] ?? String(value);
};

export const toTransactionStatusLabel = (value?: string | null): string => {
  if (!value) return "-";
  return (TRANSACTION_STATUS_LABEL as Record<string, string>)[value] ?? String(value);
};

export const toPaymentMethodLabel = (value?: string | null): string => {
  if (!value) return "-";
  return (PAYMENT_METHOD_LABEL as Record<string, string>)[value] ?? String(value);
};
