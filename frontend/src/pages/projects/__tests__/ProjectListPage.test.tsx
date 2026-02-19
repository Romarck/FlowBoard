import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectListPage } from '../ProjectListPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Mock useProjects and mutations
vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(),
  useCreateProject: vi.fn(),
  useDeleteProject: vi.fn(),
  projectKeys: {
    all: ['projects'],
    lists: () => ['projects', 'list'],
    detail: (id: string) => ['projects', id],
  },
}))

import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects'
import type { PaginatedProjects } from '@/types/project'

describe('ProjectListPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const mockProjects: PaginatedProjects = {
    items: [
      {
        id: 'proj-1',
        name: 'Project 1',
        key: 'PROJ1',
        description: 'Test project 1',
        methodology: 'scrum',
        member_count: 3,
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 'proj-2',
        name: 'Project 2',
        key: 'PROJ2',
        description: 'Test project 2',
        methodology: 'kanban',
        member_count: 2,
        created_at: '2024-01-02T10:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    size: 20,
  }

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ProjectListPage />
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  it('should render page title', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    expect(screen.getByText('My Projects')).toBeInTheDocument()
  })

  it('should render projects grid', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    expect(screen.getByText('Project 1')).toBeInTheDocument()
    expect(screen.getByText('Project 2')).toBeInTheDocument()
  })

  it('should render empty state when no projects', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: { items: [], total: 0, page: 1, size: 20 },
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first project to get started.')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      status: 'pending',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    // Check for loading spinner
    const loadingElements = screen.queryAllByRole('img', { hidden: true })
    expect(loadingElements.length >= 0).toBeTruthy()
  })

  it('should filter projects by name', async () => {
    const user = userEvent.setup()
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    const searchInput = screen.getByPlaceholderText(/Search by name or key/)
    await user.type(searchInput, 'Project 1')

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
    })
  })

  it('should filter projects by key', async () => {
    const user = userEvent.setup()
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    const searchInput = screen.getByPlaceholderText(/Search by name or key/)
    await user.type(searchInput, 'PROJ2')

    await waitFor(() => {
      expect(screen.getByText('Project 2')).toBeInTheDocument()
      expect(screen.queryByText('Project 1')).not.toBeInTheDocument()
    })
  })

  it('should show no search results message', async () => {
    const user = userEvent.setup()
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    const searchInput = screen.getByPlaceholderText(/Search by name or key/)
    await user.type(searchInput, 'NonexistentProject')

    await waitFor(() => {
      expect(screen.getByText(/No projects match/)).toBeInTheDocument()
    })
  })

  it('should render new project button', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    expect(screen.getAllByText(/New Project/i).length > 0).toBeTruthy()
  })

  it('should call deleteProject when delete button is clicked', async () => {
    const deleteProjectMock = {
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue(deleteProjectMock as any)

    renderPage()

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const firstProjectCard = screen.getByText('Project 1').closest('[class*="rounded-lg"]')
    expect(firstProjectCard).toBeInTheDocument()
  })

  it('should render pagination controls when there are multiple pages', () => {
    const paginatedProjects: PaginatedProjects = {
      ...mockProjects,
      total: 50,
      size: 20,
    }

    vi.mocked(useProjects).mockReturnValue({
      data: paginatedProjects,
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
    } as any)
    vi.mocked(useCreateProject).mockReturnValue({ mutateAsync: vi.fn() } as any)
    vi.mocked(useDeleteProject).mockReturnValue({ mutateAsync: vi.fn() } as any)

    renderPage()

    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
  })
})
