/**
 * ResponsiveKanbanBoard - Mobile-optimized Kanban with single-column layout
 * (E1.4 - Mobile Kanban Optimization)
 *
 * Desktop: Multi-column horizontal scroll
 * Mobile (<640px): Single-column carousel with tab navigation
 * Tablet: Adaptive 2-column layout
 *
 * Touch targets: ≥44px (WCAG mobile accessibility)
 */

import { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'
import type { IssueListItem } from '@/api/issues'
import type { WorkflowStatus } from '@/types/project'

interface ResponsiveKanbanBoardProps {
  statuses: WorkflowStatus[]
  issues: IssueListItem[]
  onIssueClick: (issue: IssueListItem) => void
  onIssueMove?: (issueId: string, newStatusId: string) => void
}

export function ResponsiveKanbanBoard({
  statuses,
  issues,
  onIssueClick,
  onIssueMove,
}: ResponsiveKanbanBoardProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0)

  // Group issues by status
  const issuesByStatus = statuses.map((status) => ({
    status,
    issues: issues.filter((i) => i.status_id === status.id),
  }))

  // Mobile: Single column view with tabs
  if (isMobile) {
    const currentColumn = issuesByStatus[mobileColumnIndex]

    return (
      <div className="flex flex-col h-full gap-4">
        {/* Mobile Navigation Tabs - Touch-friendly (48px min height) */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-4 -mx-4">
          {issuesByStatus.map((col, idx) => (
            <button
              key={col.status.id}
              onClick={() => setMobileColumnIndex(idx)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all
                touch-target-mobile
                ${
                  idx === mobileColumnIndex
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span className="text-sm">{col.status.name}</span>
              <span className="ml-2 text-xs font-semibold opacity-75">
                ({col.issues.length})
              </span>
            </button>
          ))}
        </div>

        {/* Mobile Column Content - Full width single column */}
        <div className="flex-1 px-4 overflow-y-auto">
          {currentColumn && (
            <DndContext onDragEnd={(e) => handleMobileDragEnd(e, onIssueMove)}>
              <KanbanColumn
                status={currentColumn.status}
                issues={currentColumn.issues}
                onIssueClick={onIssueClick}
              />
            </DndContext>
          )}
        </div>

        {/* Mobile Indicator - Show which column you're on */}
        <div className="px-4 py-2 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Column {mobileColumnIndex + 1} of {issuesByStatus.length}
          </span>
        </div>
      </div>
    )
  }

  // Tablet: 2-column layout
  if (isTablet) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        <DndContext onDragEnd={(e) => handleDragEnd(e, onIssueMove)}>
          {issuesByStatus.map((col) => (
            <div key={col.status.id} className="flex-shrink-0 w-96">
              <KanbanColumn
                status={col.status}
                issues={col.issues}
                onIssueClick={onIssueClick}
              />
            </div>
          ))}
        </DndContext>
      </div>
    )
  }

  // Desktop: Multi-column horizontal scroll
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-4">
      <DndContext onDragEnd={(e) => handleDragEnd(e, onIssueMove)}>
        {issuesByStatus.map((col) => (
          <div key={col.status.id} className="flex-shrink-0 w-72">
            <KanbanColumn
              status={col.status}
              issues={col.issues}
              onIssueClick={onIssueClick}
            />
          </div>
        ))}
      </DndContext>
    </div>
  )
}

/**
 * Handle drag end for desktop/tablet
 */
function handleDragEnd(event: any, onIssueMove?: (issueId: string, newStatusId: string) => void) {
  const { active, over } = event

  if (!over || active.id === over.id) return

  // Find issue and new status
  const issueId = active.id
  const newStatusId = over.id

  onIssueMove?.(issueId, newStatusId)
}

/**
 * Handle drag end for mobile (single column)
 * Mobile drag is within same column, so status doesn't change
 */
function handleMobileDragEnd(event: any, onIssueMove?: (issueId: string, newStatusId: string) => void) {
  const { active, over } = event

  if (!over || active.id === over.id) return

  // On mobile, we don't change status, just reorder within column
  // Real app would implement drag-to-reorder within column
}
