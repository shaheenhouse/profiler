"use client";

import { useEffect, useRef } from "react";
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  CopyPlus,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
  Group,
  Ungroup,
  Lock,
  Unlock,
  MousePointerClick,
  Eraser,
} from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";
import type { Object as FabricObject } from "fabric";

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
  selectedObject: FabricObject | null;
}

interface MenuItem {
  label: string;
  icon: typeof Copy;
  action: () => void;
  shortcut?: string;
  danger?: boolean;
  show?: boolean;
  disabled?: boolean;
}

export function DesignContextMenu({
  x,
  y,
  isOpen,
  onClose,
  canvasRef,
  selectedObject,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  const hasObject = !!selectedObject;
  const isGroup = selectedObject?.type === "group";
  const isMultiSelect =
    selectedObject?.type === "activeselection" || selectedObject?.type === "activeSelection";
  const isLocked = (selectedObject as any)?.lockMovementX || false;

  const exec = (action: () => void) => {
    action();
    onClose();
  };

  const sections: (MenuItem | "separator")[][] = [];

  if (hasObject) {
    sections.push([
      { label: "Copy", icon: Copy, action: () => exec(() => canvasRef.current?.copySelected()), shortcut: "Ctrl+C" },
      { label: "Cut", icon: Scissors, action: () => exec(() => canvasRef.current?.cutSelected()), shortcut: "Ctrl+X" },
      { label: "Paste", icon: ClipboardPaste, action: () => exec(() => canvasRef.current?.paste()), shortcut: "Ctrl+V" },
    ]);
    sections.push([
      { label: "Duplicate", icon: CopyPlus, action: () => exec(() => canvasRef.current?.duplicate()), shortcut: "Ctrl+D" },
      { label: "Delete", icon: Trash2, action: () => exec(() => canvasRef.current?.deleteSelected()), shortcut: "Del", danger: true },
    ]);
    sections.push([
      { label: "Bring to Front", icon: ArrowUpToLine, action: () => exec(() => canvasRef.current?.bringToFront()) },
      { label: "Bring Forward", icon: MoveUp, action: () => exec(() => canvasRef.current?.bringForward()) },
      { label: "Send Backward", icon: MoveDown, action: () => exec(() => canvasRef.current?.sendBackward()) },
      { label: "Send to Back", icon: ArrowDownToLine, action: () => exec(() => canvasRef.current?.sendToBack()) },
    ]);

    if (isMultiSelect) {
      sections.push([
        { label: "Group", icon: Group, action: () => exec(() => canvasRef.current?.group()), shortcut: "Ctrl+G" },
      ]);
    }
    if (isGroup) {
      sections.push([
        { label: "Ungroup", icon: Ungroup, action: () => exec(() => canvasRef.current?.ungroup()), shortcut: "Ctrl+Shift+G" },
      ]);
    }

    sections.push([
      {
        label: isLocked ? "Unlock" : "Lock",
        icon: isLocked ? Unlock : Lock,
        action: () => exec(() => {
          if (!selectedObject) return;
          const lock = !isLocked;
          selectedObject.set({
            lockMovementX: lock, lockMovementY: lock,
            lockScalingX: lock, lockScalingY: lock,
            lockRotation: lock, hasControls: !lock, selectable: true,
          } as any);
          canvasRef.current?.getCanvas()?.renderAll();
        }),
      },
    ]);
  } else {
    sections.push([
      { label: "Paste", icon: ClipboardPaste, action: () => exec(() => canvasRef.current?.paste()), shortcut: "Ctrl+V" },
      { label: "Select All", icon: MousePointerClick, action: () => exec(() => canvasRef.current?.selectAll()), shortcut: "Ctrl+A" },
    ]);
    sections.push([
      { label: "Clear Canvas", icon: Eraser, action: () => exec(() => canvasRef.current?.clearCanvas()), danger: true },
    ]);
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[200px] bg-popover border border-border rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {sIdx > 0 && <div className="h-px bg-border mx-2 my-1" />}
          {section.map((item) => {
            if (item === "separator") return null;
            const { label, icon: Icon, action, shortcut, danger, disabled } = item as MenuItem;
            return (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors
                  ${danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent"}
                  ${disabled ? "opacity-40 pointer-events-none" : ""}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {shortcut && (
                  <span className="text-[10px] text-muted-foreground ml-4">{shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
