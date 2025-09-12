# QueryActionBar（查询/操作栏）

- 路径：`src/components/layouts/query-action-bar.tsx`
- 作用：提供通用的“左侧查询条件 + 右侧操作按钮”布局，支持两侧在空间不足时自动换行，避免被挤压。

## 使用方式

```tsx
import { QueryActionBar } from "@/components/layouts/query-action-bar";

<QueryActionBar
  left={
    <>
      {/* 左侧：查询条件，自动换行 */}
      <Input className="min-w-[200px]" placeholder="关键词..." />
      <Select>
        <SelectTrigger className="w-32">状态</SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>
      <Button size="sm">查询</Button>
    </>
  }
  right={
    <>
      {/* 右侧：操作按钮，自动换行，小屏可独占一行并右对齐 */}
      <Button variant="outline" size="sm">
        导入
      </Button>
      <Button variant="outline" size="sm">
        导出
      </Button>
      <Button size="sm">新增</Button>
    </>
  }
/>;
```

## 样式扩展

- 外层容器：`className`
- 左侧容器：`leftClassName`
- 右侧容器：`rightClassName`

组件默认样式要点：

- 外层：`flex flex-wrap items-center gap-3`
- 左侧：`flex grow flex-wrap min-w-[260px]`
- 右侧：`flex flex-wrap w-full sm:w-auto sm:ml-auto sm:justify-end`

## 适用模块

- 客户管理（已接入 `dashboard/customer`）
- 产品管理、交易记录等需要“查询 + 操作”工具栏的页面
