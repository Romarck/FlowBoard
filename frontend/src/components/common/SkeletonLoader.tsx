/**
 * SkeletonLoader - Reusable skeleton loading component (E1.5)
 *
 * Displays placeholder content while data loads, improving perceived performance
 * Zero layout shift (CLS = 0) with fixed-height skeletons
 *
 * Usage:
 *   <SkeletonLoader type="card" count={3} />
 *   <SkeletonLoader type="text" lines={2} />
 *   <SkeletonLoader type="table" rows={5} cols={4} />
 */

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'line' | 'circle' | 'table' | 'issue-list' | 'kanban'
  count?: number
  lines?: number
  rows?: number
  cols?: number
  className?: string
}

/**
 * Animated skeleton bar (pulse animation)
 */
function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      aria-hidden="true"
      role="status"
    />
  )
}

/**
 * Skeleton Card - for issue cards, project cards, etc.
 */
function SkeletonCard() {
  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header - Icon + Key */}
      <div className="mb-2 flex items-center gap-2">
        <SkeletonBar className="h-4 w-4 rounded" />
        <SkeletonBar className="h-3 w-12" />
      </div>

      {/* Title - 2 lines */}
      <div className="mb-3 space-y-2">
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-3/4" />
      </div>

      {/* Bottom - Priority + Avatar + Points */}
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-5 w-16 rounded-full" />
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-5 w-5 rounded-full" />
          <SkeletonBar className="h-4 w-6" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton Text Lines
 */
function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton Single Line
 */
function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <SkeletonBar className={`h-4 ${width}`} />
}

/**
 * Skeleton Circle (for avatars)
 */
function SkeletonCircle({ size = 'h-10 w-10' }: { size?: string }) {
  return <SkeletonBar className={`rounded-full ${size}`} />
}

/**
 * Skeleton Table
 */
function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBar key={`cell-${rowIdx}-${colIdx}`} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton Issue List (header + multiple cards)
 */
function SkeletonIssueList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* List header */}
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-6 w-32" />
        <SkeletonBar className="h-6 w-12 rounded-full ml-auto" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton Kanban Board (multiple columns)
 */
function SkeletonKanban({ cols = 3, cardCount = 4 }: { cols?: number; cardCount?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto">
      {Array.from({ length: cols }).map((_, colIdx) => (
        <div key={colIdx} className="flex-shrink-0 w-72">
          {/* Column header */}
          <div className="mb-3 flex items-center justify-between">
            <SkeletonBar className="h-5 w-24" />
            <SkeletonBar className="h-6 w-8 rounded-full" />
          </div>

          {/* Cards in column */}
          <div className="space-y-3">
            {Array.from({ length: cardCount }).map((_, cardIdx) => (
              <SkeletonCard key={cardIdx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Main SkeletonLoader Component
 */
export function SkeletonLoader({
  type = 'card',
  count = 3,
  lines = 3,
  rows = 5,
  cols = 4,
  className = '',
}: SkeletonLoaderProps) {
  const containerClass = `skeleton-loader ${className}`

  // Add ARIA live region for accessibility
  const ariaLabel = `Loading ${type} content...`

  switch (type) {
    case 'card':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonText lines={lines} />
        </div>
      )

    case 'line':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonLine />
        </div>
      )

    case 'circle':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonCircle />
        </div>
      )

    case 'table':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonTable rows={rows} cols={cols} />
        </div>
      )

    case 'issue-list':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonIssueList count={count} />
        </div>
      )

    case 'kanban':
      return (
        <div className={containerClass} role="status" aria-label={ariaLabel}>
          <SkeletonKanban cols={cols} cardCount={count} />
        </div>
      )

    default:
      return null
  }
}

/**
 * Fade-in transition component for skeleton to real content
 * Prevents layout shift and provides smooth transition
 */
export function SkeletonFadeIn({
  isLoading,
  children,
  skeleton,
  duration = 300,
}: {
  isLoading: boolean
  children: React.ReactNode
  skeleton: React.ReactNode
  duration?: number
}) {
  return (
    <div
      style={{
        transition: `opacity ${duration}ms ease-in-out`,
        opacity: isLoading ? 0 : 1,
      }}
    >
      {isLoading ? skeleton : children}
    </div>
  )
}
