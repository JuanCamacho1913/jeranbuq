"use client";

import { useState, useTransition } from "react";
import type { TimeBlock } from "@barberia-jeranbuq/database";
import { deleteTimeBlockAction } from "@/backend/actions/availability.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC", // dates are stored as UTC midnight
  });
}

// ─── TimeBlockRow ─────────────────────────────────────────────────────────────

function TimeBlockRow({ block }: { block: TimeBlock }) {
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this time block? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteTimeBlockAction(block.id);
      if (!result.ok) {
        setDeleteError(result.error ?? "Failed to delete time block.");
      }
    });
  }

  return (
    <TableRow>
      {/* Date */}
      <TableCell className="font-medium">{formatDate(block.date)}</TableCell>

      {/* Time range */}
      <TableCell>
        {block.startTime} – {block.endTime}
      </TableCell>

      {/* Reason */}
      <TableCell>
        {block.reason ? (
          <Badge variant="secondary">{block.reason}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Delete action */}
      <TableCell>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? "Deleting…" : "Delete"}
        </Button>
        {deleteError && (
          <p className="text-xs text-destructive mt-1">{deleteError}</p>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── TimeBlockList ────────────────────────────────────────────────────────────

interface TimeBlockListProps {
  /** Upcoming time blocks sorted by date ascending (fetched by the RSC page). */
  timeBlocks: TimeBlock[];
}

/**
 * Table of upcoming time blocks with delete action per row.
 * Renders an empty state when no blocks exist.
 */
export function TimeBlockList({ timeBlocks }: TimeBlockListProps) {
  if (timeBlocks.length === 0) {
    return (
      <div className="rounded-md border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No upcoming time blocks. Use the form above to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time range</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeBlocks.map((block) => (
            <TimeBlockRow key={block.id} block={block} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
