"use client";

import * as React from "react";
import useSWR from "swr";
import { ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/utils/fetch-with-auth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: unknown;
}

interface WorkItem {
  novelId: string;
  title: string;
}

interface WorksList {
  data: WorkItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NovelSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  open?: boolean;
}

const isApiResponse = <T,>(input: unknown): input is ApiResponse<T> => {
  return Boolean(
    input &&
      typeof input === "object" &&
      "success" in (input as Record<string, unknown>) &&
      "data" in (input as Record<string, unknown>),
  );
};

const isWorksList = (input: unknown): input is WorksList => {
  return Boolean(input && typeof input === "object" && "data" in (input as Record<string, unknown>));
};

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取小说列表失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const json = (await res.json()) as unknown;
  if (isApiResponse<WorksList>(json)) {
    return json.data?.data ?? [];
  }
  if (isWorksList(json)) {
    return json.data ?? [];
  }
  return [];
};

export function NovelSelect({ value, onChange, placeholder = "选择关联小说", disabled, open }: NovelSelectProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const shouldFetch =
    (open ?? popoverOpen) ? "/api/v1/novels/works?limit=100&page=1&sortBy=createdAt&sortOrder=desc" : null;
  const {
    data: options = [],
    isLoading,
    error,
  } = useSWR<WorkItem[]>(shouldFetch, fetcher, {
    revalidateOnFocus: false,
  });

  const selectedOption = options.find((item) => item.novelId === value);
  const buttonLabel = selectedOption ? `${selectedOption.title} (${selectedOption.novelId})` : value || placeholder;

  const handleSelect = (novelId?: string) => {
    onChange(novelId);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className={cn("justify-between", !value && "text-muted-foreground")}
          disabled={disabled}
          onClick={() => {
            if (open === false) return;
            setPopoverOpen((prev) => !prev);
          }}
        >
          <span className="truncate text-left">
            {isLoading ? "加载中..." : error ? "加载失败" : buttonLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder="搜索小说标题或 ID" />
          <CommandList>
            <CommandEmpty>{isLoading ? "加载中..." : "未找到匹配的小说"}</CommandEmpty>
            <CommandGroup heading="选择小说">
              <CommandItem
                value="__none__"
                onSelect={() => handleSelect(undefined)}
                className={cn(!value && "bg-muted text-foreground")}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                不关联任何小说
              </CommandItem>
              {options.map((item) => (
                <CommandItem key={item.novelId} value={item.novelId} onSelect={() => handleSelect(item.novelId)}>
                  <Check className={cn("mr-2 h-4 w-4", value === item.novelId ? "opacity-100" : "opacity-0")} />
                  <span className="flex flex-col text-left">
                    <span className="text-sm font-medium">{item.title || item.novelId}</span>
                    <span className="text-muted-foreground text-xs">{item.novelId}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
