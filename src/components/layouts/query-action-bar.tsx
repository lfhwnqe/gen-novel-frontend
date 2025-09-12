"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface QueryActionBarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

// 通用查询/操作栏布局：
// - 外层支持 flex-wrap，确保左右区域在空间不足时自动换行
// - 左侧（查询条件）flex-wrap，随着条件增多自动换行
// - 右侧（操作按钮）同样支持换行；在小屏/拥挤时可独占一行并右对齐
export function QueryActionBar({ left, right, className, leftClassName, rightClassName }: QueryActionBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 md:gap-4", className)}>
      <div
        className={cn(
          // 左侧区域：可增长、最小宽度保障、换行
          "flex min-w-[260px] grow flex-wrap items-center gap-2 md:gap-3",
          leftClassName,
        )}
      >
        {left}
      </div>
      <div
        className={cn(
          // 右侧区域：在小屏或拥挤时换到下一行并撑满一行，右对齐
          // 宽屏则为自适应宽度，靠右对齐
          "flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end md:gap-3",
          rightClassName,
        )}
      >
        {right}
      </div>
    </div>
  );
}

export default QueryActionBar;
