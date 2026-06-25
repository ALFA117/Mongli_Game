"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback } from "react";
import type { AchievementCategory } from "@/lib/audio";

export interface AchievementNotifItem {
  id: string;
  title: string;
  asciiIcon: string;
  category: AchievementCategory;
}

interface AchievementNotificationProps {
  queue: AchievementNotifItem[];
  onDismiss: (id: string) => void;
  onClickNotif: () => void;
}

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  exploration: "exploración",
  decision: "decisión",
  obsession: "obsesión",
  verification: "verificación",
  balance: "equilibrio",
  general: "general",
};

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  exploration: "#c4923a",
  decision: "#dc2626",
  obsession: "#a855f7",
  verification: "#22c55e",
  balance: "#3b82f6",
  general: "#e8d5b0",
};

function NotificationCard({
  item,
  index,
  onDismiss,
  onClick,
}: {
  item: AchievementNotifItem;
  index: number;
  onDismiss: () => void;
  onClick: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const color = CATEGORY_COLORS[item.category];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className="uxpm-glass uxpm-press px-4 py-3 shadow-xl w-[260px] sm:w-[280px] text-left relative overflow-hidden group"
      style={{
        marginTop: index > 0 ? 8 : 0,
        boxShadow: `0 0 15px ${color}20, inset 0 0 15px ${color}05`,
      }}
    >
      {/* Progress bar that drains over 4 seconds */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ backgroundColor: color }}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
      />

      <div className="flex items-center gap-3">
        {/* ASCII icon */}
        <span
          className="font-mono text-[18px] shrink-0 select-none"
          style={{ color }}
        >
          {item.asciiIcon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[7px] font-body uppercase tracking-wider"
              style={{ color }}
            >
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
          <p className="font-display text-[11px] text-noir-text truncate">
            {item.title}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default function AchievementNotification({
  queue,
  onDismiss,
  onClickNotif,
}: AchievementNotificationProps) {
  // Show max 3 at a time
  const visible = queue.slice(0, 3);

  const handleDismiss = useCallback(
    (id: string) => onDismiss(id),
    [onDismiss]
  );

  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-[10000] flex flex-col items-end">
      <AnimatePresence mode="popLayout">
        {visible.map((item, i) => (
          <NotificationCard
            key={item.id}
            item={item}
            index={i}
            onDismiss={() => handleDismiss(item.id)}
            onClick={onClickNotif}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
