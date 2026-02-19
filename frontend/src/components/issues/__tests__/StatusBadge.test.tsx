import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'
import type { WorkflowStatus } from '@/types/project'

describe('StatusBadge', () => {
  it('should render the status name', () => {
    const status: WorkflowStatus = {
      id: '1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    render(<StatusBadge status={status} />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('should apply todo styles', () => {
    const status: WorkflowStatus = {
      id: '1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('should apply in_progress styles', () => {
    const status: WorkflowStatus = {
      id: '2',
      name: 'In Progress',
      category: 'in_progress',
      position: 1,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
  })

  it('should apply done styles', () => {
    const status: WorkflowStatus = {
      id: '3',
      name: 'Done',
      category: 'done',
      position: 3,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('should apply cancelled styles', () => {
    const status: WorkflowStatus = {
      id: '4',
      name: 'Cancelled',
      category: 'cancelled',
      position: 2,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-red-100', 'text-red-600')
  })

  it('should apply custom className', () => {
    const status: WorkflowStatus = {
      id: '1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} className="custom-class" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('custom-class')
  })

  it('should have proper padding and size classes', () => {
    const status: WorkflowStatus = {
      id: '1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs', 'font-medium', 'rounded-full')
  })

  it('should fallback to todo styles for unknown category', () => {
    const status: WorkflowStatus = {
      id: '1',
      name: 'Unknown',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
  })
})
