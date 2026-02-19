import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from '../PriorityBadge'
import type { IssuePriority } from '@/types/issue'

describe('PriorityBadge', () => {
  it('should render badge for critical priority', () => {
    const priority: IssuePriority = 'critical'
    render(<PriorityBadge priority={priority} />)

    const badge = screen.getByText('Critical')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-700')
  })

  it('should render badge for high priority', () => {
    const priority: IssuePriority = 'high'
    render(<PriorityBadge priority={priority} />)

    const badge = screen.getByText('High')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-orange-100')
    expect(badge).toHaveClass('text-orange-700')
  })

  it('should render badge for medium priority', () => {
    const priority: IssuePriority = 'medium'
    render(<PriorityBadge priority={priority} />)

    const badge = screen.getByText('Medium')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-700')
  })

  it('should render badge for low priority', () => {
    const priority: IssuePriority = 'low'
    render(<PriorityBadge priority={priority} />)

    const badge = screen.getByText('Low')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('text-gray-600')
  })

  it('should apply custom className', () => {
    const priority: IssuePriority = 'high'
    render(<PriorityBadge priority={priority} className="custom-class" />)

    const badge = screen.getByText('High')
    expect(badge).toHaveClass('custom-class')
  })

  it('should have correct styling classes', () => {
    const priority: IssuePriority = 'critical'
    render(<PriorityBadge priority={priority} />)

    const badge = screen.getByText('Critical')
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('rounded-full')
    expect(badge).toHaveClass('px-2.5')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-medium')
  })
})
