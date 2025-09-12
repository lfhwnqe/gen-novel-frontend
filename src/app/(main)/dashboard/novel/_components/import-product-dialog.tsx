"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

// ============ 可按需调整的接口常量 ============
const PRESIGNED_API = "/api/v1/import-export/imports/presigned-url";
const IMPORT_PARSE_API = "/api/v1/products/imports/s3";

const EXCEL_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;
type ExcelMime = (typeof EXCEL_MIME)[number];

type PresignedPut = { url: string; key?: string; objectKey?: string; method?: "PUT" | "put" };
type PresignedPost = {
  url: string;
  fields: Record<string, string>;
  key?: string;
  objectKey?: string;
  method?: "POST" | "post";
};
type PresignedData = PresignedPut | PresignedPost;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: unknown;
}

function normalizePresigned(input: any): PresignedData | null {
  if (!input) return null;
  const d =
    typeof input === "object" && input && "success" in input && "data" in input
      ? (input as ApiResponse<any>).data
      : input;
  if (d && typeof d === "object") {
    const putUrl = d.uploadUrl || d.presignedUrl || d.signedUrl;
    if (typeof putUrl === "string")
      return { url: putUrl, key: d.key || d.objectKey, objectKey: d.objectKey, method: "PUT" };
    if (typeof d.url === "string" && d.fields && typeof d.fields === "object")
      return { url: d.url, fields: d.fields, key: d.key, objectKey: d.objectKey, method: d.method || "POST" };
    if (typeof d.url === "string")
      return { url: d.url, key: d.key || d.objectKey, objectKey: d.objectKey, method: d.method || "PUT" };
  }
  return null;
}

function getFileMime(file: File): ExcelMime {
  const t = (file.type || "").toLowerCase();
  if (EXCEL_MIME.includes(t as ExcelMime)) return t as ExcelMime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/vnd.ms-excel";
}

function pickKeyFromPresigned(p: PresignedData): string | undefined {
  if ("fields" in p && p.fields?.key) return p.fields.key;
  if ("key" in p && (p as any).key) return (p as any).key;
  if ("objectKey" in p && (p as any).objectKey) return (p as any).objectKey;
  return undefined;
}

async function uploadToS3(presigned: PresignedData, file: File, contentType: string): Promise<Response> {
  if ("fields" in presigned) {
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file);
    return fetch(presigned.url, { method: "POST", body: formData });
  }
  return fetch(presigned.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
}

export function ImportProductDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  const reset = () => setFile(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null);

  const handleImport = async () => {
    if (!file) return toast.error("请先选择要导入的 Excel 文件");
    const contentType = getFileMime(file);
    setBusy(true);
    try {
      const presignedRes = await fetchWithAuth(PRESIGNED_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType, type: "product" }),
      });
      if (!presignedRes.ok) {
        const err = await presignedRes.json().catch(() => ({}) as any);
        const msg =
          err?.message?.message ||
          err?.message ||
          `获取预签名链接失败: ${presignedRes.status} ${presignedRes.statusText}`;
        throw new Error(msg);
      }
      const presignedJson = await presignedRes.json().catch(() => null);
      if (!presignedJson) throw new Error("预签名响应为空");
      const presigned = normalizePresigned(presignedJson);
      if (!presigned || !("url" in presigned) || !presigned.url) throw new Error("预签名数据无效");

      const objectKey = pickKeyFromPresigned(presigned);
      const uploadRes = await uploadToS3(presigned, file, contentType);
      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => "");
        throw new Error(`上传到 S3 失败: ${uploadRes.status} ${uploadRes.statusText}${text ? ` - ${text}` : ""}`);
      }

      const key = objectKey || file.name;
      const parseRes = await fetchWithAuth(IMPORT_PARSE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!parseRes.ok) {
        const err = await parseRes.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `导入解析失败: ${parseRes.status} ${parseRes.statusText}`;
        throw new Error(msg);
      }

      const resultJson = await parseRes.json().catch(() => null);
      const resultData =
        resultJson && typeof resultJson === "object" && "success" in resultJson && "data" in resultJson
          ? (resultJson as ApiResponse<any>).data
          : resultJson;

      const successCount = Number(resultData?.successCount ?? 0);
      const failureCount = Number(resultData?.failureCount ?? 0);
      const skippedCount = Number(resultData?.skippedCount ?? 0);
      const totalCount = Number(resultData?.totalCount ?? successCount + failureCount + skippedCount);
      const errors: Array<{ row?: number; error?: string }> = Array.isArray(resultData?.errors)
        ? resultData.errors
        : [];
      const summary =
        typeof resultData?.message === "string" && resultData.message
          ? resultData.message
          : `导入完成：成功 ${successCount} 条，失败 ${failureCount} 条，跳过 ${skippedCount} 条${Number.isFinite(totalCount) ? `（共 ${totalCount} 条）` : ""}`;
      const briefErr = errors.length
        ? `｜示例：${errors
            .slice(0, 2)
            .map((e) => `第${e?.row ?? "?"}行：${e?.error ?? "未知错误"}`)
            .join("；")}${errors.length > 2 ? ` 等 ${errors.length} 条问题` : ""}`
        : "";

      if (failureCount > 0) toast.error(`${summary}${briefErr}`);
      else if (skippedCount > 0) {
        const anyToast = toast as unknown as Record<string, any>;
        if (typeof anyToast.warning === "function") anyToast.warning(`${summary}${briefErr}`);
        else toast.success(`${summary}${briefErr}`);
      } else toast.success(summary);

      onOpenChange(false);
      reset();
      onImported?.();
    } catch (e: any) {
      toast.error(e?.message || "导入失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入产品</DialogTitle>
          <DialogDescription>选择 Excel 文件（.xlsx / .xls），系统将上传至 S3 并提交解析。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-import-file">选择文件</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id="product-import-file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                disabled={busy}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">仅支持 .xlsx 与 .xls，大小以 S3 与后端配置为准。</p>
          </div>
          {file ? (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="truncate">
                    {file.name}{" "}
                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)} disabled={busy}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
          <Separator />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={!file || busy}>
              <UploadCloud className="mr-2 h-4 w-4" /> {busy ? "上传中..." : "开始导入"}
            </Button>
          </div>
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
