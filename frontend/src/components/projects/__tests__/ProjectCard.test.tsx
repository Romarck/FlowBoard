import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from '../ProjectCard'
import type { ProjectListItem } from '@/types/project'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock lucide-react
vi.mock('lucide-react', () => ({
  MoreVertical: () => <span data-testid="more-icon">more</span>,
  Users: () => <span data-testid="users-icon">users</span>,
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatDate: (date: string) => 'Jan 15, 2024',
}))

describe('ProjectCard', () => {
  const mockProject: ProjectListItem = {
    id: 'proj-1',
    name: 'Test Project',
    key: 'TP',
    description: 'A test project',
    methodology: 'scrum',
    member_count: 3,
    created_at: '2024-01-15T10:00:00Z',
  }

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
  })

  it('should render project name', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render project description', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('A test project')).toBeInTheDocument()
  })

  it('should render fallback when no description', () => {
    const projectWithoutDesc = { ...mockProject, description: null }
    render(
      <ProjectCard
        project={projectWithoutDesc}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('No description')).toBeInTheDocument()
  })

  it('should render project key', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('TP')).toBeInTheDocument()
  })

  it('should render methodology badge as Scrum', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Scrum')).toBeInTheDocument()
  })

  it('should render methodology badge as Kanban', () => {
    const kanbanProject = { ...mockProject, methodology: 'kanban' as const }
    render(
      <ProjectCard
        project={kanbanProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Kanban')).toBeInTheDocument()
  })

  it('should render member count', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('3 members')).toBeInTheDocument()
  })

  it('should render singular member text', () => {
    const singleMemberProject = { ...mockProject, member_count: 1 }
    render(
      <ProjectCard
        project={singleMemberProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('1 member')).toBeInTheDocument()
  })

  it('should render created date', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
  })

  it('should render more options icon', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId('more-icon')).toBeInTheDocument()
  })

  it('should render users icon', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('should have proper card styling', () => {
    const { container } = render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const card = container.querySelector('div')
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('shadow-sm')
  })

  it('should display scrum methodology with green color', () => {
    const { container } = render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const scrumBadge = container.querySelector('.bg-green-100')
    expect(scrumBadge).toBeInTheDocument()
  })

  it('should display kanban methodology with blue color', () => {
    const kanbanProject = { ...mockProject, methodology: 'kanban' as const }
    const { container } = render(
      <ProjectCard
        project={kanbanProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const kanbanBadge = container.querySelector('.bg-blue-100')
    expect(kanbanBadge).toBeInTheDocument()
  })
})
