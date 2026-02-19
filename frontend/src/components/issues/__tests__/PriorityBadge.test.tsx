import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from '../PriorityBadge'

describe('PriorityBadge', () => {
  it('should render critical priority with correct label', () => {
    render(<PriorityBadge priority="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('should render high priority with correct label', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('should render medium priority with correct label', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('should render low priority with correct label', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('should apply critical priority styles', () => {
    const { container } = render(<PriorityBadge priority="critical" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('should apply high priority styles', () => {
    const { container } = render(<PriorityBadge priority="high" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-700')
  })

  it('should apply medium priority styles', () => {
    const { container } = render(<PriorityBadge priority="medium" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
  })

  it('should apply low priority styles', () => {
    const { container } = render(<PriorityBadge priority="low" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-600')
  })

  it('should apply custom className', () => {
    const { container } = render(<PriorityBadge priority="high" className="custom-class" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('custom-class')
  })

  it('should have proper padding and size classes', () => {
    const { container } = render(<PriorityBadge priority="medium" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs', 'font-medium', 'rounded-full')
  })

  it('should have inline-flex layout', () => {
    const { container } = render(<PriorityBadge priority="low" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('inline-flex', 'items-center')
  })
})
