import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from '../ProjectCard'
import type { ProjectListItem } from '@/types/project'
import { BrowserRouter } from 'react-router-dom'

// Mock react-router-dom to avoid navigation issues in tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('ProjectCard', () => {
  const mockProject: ProjectListItem = {
    id: 'proj-1',
    name: 'Test Project',
    key: 'TEST',
    description: 'This is a test project',
    methodology: 'scrum',
    member_count: 3,
    created_at: '2024-01-01T10:00:00Z',
  }

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('should render project name', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render project description', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('This is a test project')).toBeInTheDocument()
  })

  it('should render "No description" when description is empty', () => {
    const projectWithoutDesc = { ...mockProject, description: '' }
    renderWithRouter(
      <ProjectCard
        project={projectWithoutDesc}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('No description')).toBeInTheDocument()
  })

  it('should render project key', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('TEST')).toBeInTheDocument()
  })

  it('should render scrum methodology badge', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('Scrum')).toBeInTheDocument()
  })

  it('should render kanban methodology badge', () => {
    const kanbanProject: typeof mockProject = { ...mockProject, methodology: 'kanban' as const }
    renderWithRouter(
      <ProjectCard
        project={kanbanProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Kanban')).toBeInTheDocument()
  })

  it('should render member count', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText(/3 members/)).toBeInTheDocument()
  })

  it('should render singular member text for single member', () => {
    const singleMemberProject = { ...mockProject, member_count: 1 }
    renderWithRouter(
      <ProjectCard
        project={singleMemberProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText(/1 member$/)).toBeInTheDocument()
  })

  it('should have proper card styling', () => {
    const { container } = renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    const card = container.querySelector('[class*="rounded-lg"]')
    expect(card).toHaveClass('border', 'shadow-sm')
  })

  it('should have hover effect styling', () => {
    const { container } = renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    const card = container.querySelector('[class*="hover:shadow"]')
    expect(card).toBeInTheDocument()
  })

  it('should call onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )

    // First, find and click the menu button to open the dropdown
    const menuButton = screen.getAllByRole('button')[0]
    await user.click(menuButton)

    // Then find and click the Edit button
    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockProject)
  })

  it('should call onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )

    // First, find and click the menu button to open the dropdown
    const menuButton = screen.getAllByRole('button')[0]
    await user.click(menuButton)

    // Then find and click the Delete button
    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockProject)
  })

  it('should render created date', () => {
    renderWithRouter(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    // The date should be formatted, so check that there's a date-like text
    const dateText = screen.getByText(/Jan 1|1\/1|2024/)
    expect(dateText).toBeInTheDocument()
  })
})
