"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { usePlannerStore } from "@/store/usePlannerStore";
import { ListDetail } from "./ListDetail";
import { ListsTab } from "./ListsTab";

/**
 * «Списки» — отдельная шторка: обзор всех списков или один список
 * (если открыли с ленты по «☰ 2/5» у блока).
 */
export function ListsSheet() {
  const sheet = usePlannerStore((s) => s.sheet);
  const lists = usePlannerStore((s) => s.lists);
  const closeSheet = usePlannerStore((s) => s.closeSheet);
  const open = sheet?.kind === "lists" || sheet?.kind === "list";

  const [listId, setListId] = useState<string | null>(null);
  // Как открыли: весь раздел или конкретный список
  const [openedWith, setOpenedWith] = useState(sheet);
  if (open && sheet !== openedWith) {
    setOpenedWith(sheet);
    setListId(sheet?.kind === "list" ? sheet.listId : null);
  }

  const list = listId ? lists.find((l) => l.id === listId) : undefined;

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Списки и заметки">
      {list ? <ListDetail list={list} onBack={() => setListId(null)} /> : <ListsTab onOpen={setListId} />}
    </BottomSheet>
  );
}
