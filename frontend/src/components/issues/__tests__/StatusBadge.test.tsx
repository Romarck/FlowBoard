import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'
import type { WorkflowStatus } from '@/types/project'

describe('StatusBadge', () => {
  it('should render badge for todo status', () => {
    const status: WorkflowStatus = {
      id: 'status-1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    render(<StatusBadge status={status} />)

    const badge = screen.getByText('To Do')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('text-gray-700')
  })

  it('should render badge for in_progress status', () => {
    const status: WorkflowStatus = {
      id: 'status-2',
      name: 'In Progress',
      category: 'in_progress',
      position: 1,
      wip_limit: 5,
    }
    render(<StatusBadge status={status} />)

    const badge = screen.getByText('In Progress')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100')
    expect(badge).toHaveClass('text-blue-700')
  })

  it('should render badge for done status', () => {
    const status: WorkflowStatus = {
      id: 'status-3',
      name: 'Done',
      category: 'done',
      position: 2,
      wip_limit: null,
    }
    render(<StatusBadge status={status} />)

    const badge = screen.getByText('Done')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-700')
  })

  it('should render badge for cancelled status', () => {
    const status: WorkflowStatus = {
      id: 'status-4',
      name: 'Cancelled',
      category: 'cancelled',
      position: 3,
      wip_limit: null,
    }
    render(<StatusBadge status={status} />)

    const badge = screen.getByText('Cancelled')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-600')
  })

  it('should apply custom className', () => {
    const status: WorkflowStatus = {
      id: 'status-1',
      name: 'To Do',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    render(<StatusBadge status={status} className="custom-class" />)

    const badge = screen.getByText('To Do')
    expect(badge).toHaveClass('custom-class')
  })

  it('should render status name correctly', () => {
    const status: WorkflowStatus = {
      id: 'status-custom',
      name: 'Custom Status',
      category: 'todo',
      position: 0,
      wip_limit: null,
    }
    render(<StatusBadge status={status} />)

    expect(screen.getByText('Custom Status')).toBeInTheDocument()
  })
})
