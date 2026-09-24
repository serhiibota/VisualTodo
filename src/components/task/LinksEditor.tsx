"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { uid } from "@/lib/id";
import type { TaskLink } from "@/store/types";

interface LinksEditorProps {
  links: TaskLink[];
  onChange: (links: TaskLink[]) => void;
}

function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : "https://" + value;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinksEditor({ links, onChange }: LinksEditorProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const normalized = normalizeUrl(url);

  const add = () => {
    if (!normalized) return;
    onChange([...links, { id: uid(), url: normalized, title: title.trim() || hostOf(normalized) }]);
    setUrl("");
    setTitle("");
  };

  return (
    <div>
      {links.length > 0 && (
        <ul className="mb-2 overflow-hidden rounded-2xl bg-hover">
          {links.map((link, i) => (
            <li key={link.id} className={"flex items-center gap-3 px-4 py-2.5 " + (i ? "border-t border-line" : "")}>
              <Icon name="link" size={16} className="shrink-0 text-muted" />
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-ink">{link.title}</span>
                <span className="block truncate text-[12px] text-muted">{hostOf(link.url)}</span>
              </a>
              <button
                type="button"
                aria-label="Удалить ссылку"
                onClick={() => onChange(links.filter((l) => l.id !== link.id))}
                className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-line"
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="field-shell overflow-hidden rounded-2xl bg-hover">
        <input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ссылка: notion.so/…"
          className="h-11 w-full bg-transparent px-4 text-[16px] text-ink placeholder:text-faint"
        />
        {url && (
          <div className="flex items-center border-t border-line">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название (необязательно)"
              className="h-11 min-w-0 flex-1 bg-transparent px-4 text-[16px] text-ink placeholder:text-faint"
            />
            <button
              type="button"
              onClick={add}
              disabled={!normalized}
              className="mr-1.5 h-8 shrink-0 rounded-full bg-ink px-3 text-[13px] font-medium text-milk disabled:opacity-30"
            >
              Добавить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
