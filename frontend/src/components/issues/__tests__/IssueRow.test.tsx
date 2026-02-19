import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IssueRow } from '../IssueRow'
import type { IssueListItem } from '@/api/issues'
import type { WorkflowStatus } from '@/types/project'
import type { User } from '@/types/auth'

// Mock the child components
vi.mock('../IssueTypeIcon', () => ({
  IssueTypeIcon: ({ type, className }: any) => (
    <span className={className} data-testid="issue-type-icon">
      {type}
    </span>
  ),
}))

vi.mock('../StatusBadge', () => ({
  StatusBadge: ({ status }: any) => (
    <span data-testid="status-badge">{status.name}</span>
  ),
}))

vi.mock('../PriorityBadge', () => ({
  PriorityBadge: ({ priority }: any) => (
    <span data-testid="priority-badge">{priority}</span>
  ),
}))

vi.mock('@/components/ui/UserAvatar', () => ({
  UserAvatar: ({ name }: any) => (
    <span data-testid="user-avatar">{name}</span>
  ),
}))

describe('IssueRow', () => {
  const mockIssue: IssueListItem = {
    id: 'issue-1',
    project_id: 'proj-1',
    type: 'task',
    key: 'PROJ-1',
    title: 'Test Issue',
    description: 'Test description',
    status_id: 'status-1',
    priority: 'medium',
    assignee_id: 'user-1',
    assignee: {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      avatar_url: null,
      role: 'developer',
      created_at: '2024-01-01T10:00:00Z',
    },
    reporter_id: 'user-2',
    reporter: {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      avatar_url: null,
      role: 'developer',
      created_at: '2024-01-01T10:00:00Z',
    },
    sprint_id: 'sprint-1',
    parent_id: null,
    story_points: 5,
    due_date: null,
    position: 0,
    labels: [],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  }

  const mockStatus: WorkflowStatus = {
    id: 'status-1',
    name: 'In Progress',
    category: 'in_progress',
    position: 1,
    wip_limit: null,
  }

  it('should render issue key and title', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.getByText('PROJ-1')).toBeInTheDocument()
    expect(screen.getByText('Test Issue')).toBeInTheDocument()
  })

  it('should render issue type icon', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.getByTestId('issue-type-icon')).toBeInTheDocument()
  })

  it('should render status badge when status is provided', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.getByTestId('status-badge')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should render fallback status when status is not provided', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        onClick={handleClick}
      />
    )

    expect(screen.getByText('status-1')).toBeInTheDocument()
  })

  it('should render priority badge', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.getByTestId('priority-badge')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('should render story points when provided', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should not render story points when null', () => {
    const issueWithoutPoints = { ...mockIssue, story_points: null }
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={issueWithoutPoints}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    const storyPoints = screen.queryByText('5')
    expect(storyPoints).not.toBeInTheDocument()
  })

  it('should render assignee avatar when assignee is provided', () => {
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        assignee={mockIssue.assignee}
        onClick={handleClick}
      />
    )

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should not render avatar when assignee is not provided', () => {
    const issueWithoutAssignee = { ...mockIssue, assignee_id: null, assignee: null }
    const handleClick = vi.fn()
    render(
      <IssueRow
        issue={issueWithoutAssignee}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
  })

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    const rowElement = container.querySelector('div')
    if (rowElement) {
      await user.click(rowElement)
    }

    expect(handleClick).toHaveBeenCalled()
  })

  it('should have cursor pointer class', () => {
    const handleClick = vi.fn()
    const { container } = render(
      <IssueRow
        issue={mockIssue}
        status={mockStatus}
        onClick={handleClick}
      />
    )

    const rowElement = container.querySelector('div')
    expect(rowElement).toHaveClass('cursor-pointer')
  })
})
