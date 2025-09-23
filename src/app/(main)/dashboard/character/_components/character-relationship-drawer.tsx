"use client";

import * as React from "react";

import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface CharacterRelationshipDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCharacterId: string;
  relatedCharacterId: string;
}

export function CharacterRelationshipDrawer({
  open,
  onOpenChange,
  currentCharacterId,
  relatedCharacterId,
}: CharacterRelationshipDrawerProps) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>角色关系详情</DrawerTitle>
        </DrawerHeader>
        <div className="text-muted-foreground px-6 py-4 text-sm">
          当前角色 ID：{currentCharacterId}
          <br />
          关联角色 ID：{relatedCharacterId}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
