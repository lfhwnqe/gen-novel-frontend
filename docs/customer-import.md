# 客户导入（Presigned S3 直传）

本功能在 `客户列表` 页面右上角「导入」按钮中提供。逻辑流程：

1. 选择本地 Excel 文件（`.xlsx`/`.xls`）。
2. 调用后端获取预签名链接：`POST /api/v1/customers/imports/s3`。
3. 根据返回（支持 `PUT` 或 `POST` 两种预签名形式）直传文件到 S3。
4. 将返回的 S3 对象 `key` 传给导入解析接口：`POST /api/v1/customers/imports`，后台异步解析。

## 代码位置

- 入口页面：`src/app/(main)/dashboard/customer/page.tsx`
- 列表组件：`src/app/(main)/dashboard/customer/_components/data-table.tsx`
- 导入弹窗：`src/app/(main)/dashboard/customer/_components/import-customer-dialog.tsx`

## 可配置常量

位于 `import-customer-dialog.tsx` 顶部：

- `PRESIGNED_API`：预签名获取接口路径，默认 `"/api/v1/customers/imports/s3"`。
- `IMPORT_PARSE_API`：导入解析接口路径，默认 `"/api/v1/customers/imports"`。

如后端路径不同，可在上述常量处调整。

## MIME 类型

仅支持以下 Excel MIME：

- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`（xlsx）
- `application/vnd.ms-excel`（xls）

若浏览器未提供正确 `file.type`，会按扩展名兜底。

## 错误处理

- 预签名获取失败、S3 上传失败、解析接口失败均会通过 `sonner` 弹出错误提示。
- 上传成功后提示“客户导入任务已提交，后台正在解析”，随后刷新列表。

## 注意

- S3 直传需服务端/桶已配置 CORS。
- 解析接口需能接收 `key` 字段，例如：`{ key: "customers/2024-08-15.xlsx" }`。
