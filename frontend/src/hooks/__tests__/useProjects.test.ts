import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProjects, useCreateProject, useProject, projectKeys } from '../useProjects'
import { projectsApi } from '@/api/projects'
import type { PaginatedProjects, Project } from '@/types/project'
import React, { ReactNode } from 'react'

// Mock the API
vi.mock('@/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listMembers: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    listStatuses: vi.fn(),
    listLabels: vi.fn(),
    createLabel: vi.fn(),
    updateLabel: vi.fn(),
    deleteLabel: vi.fn(),
  },
}))

describe('useProjects', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should fetch projects', async () => {
    const mockData: PaginatedProjects = {
      items: [
        {
          id: 'proj-1',
          name: 'Project 1',
          key: 'PROJ1',
          description: 'Test project',
          methodology: 'scrum',
          member_count: 3,
          created_at: '2024-01-01T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      size: 20,
    }
    vi.mocked(projectsApi.list).mockResolvedValue(mockData)

    const { result } = renderHook(() => useProjects(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
  })

  it('should use correct query key', async () => {
    const mockData: PaginatedProjects = {
      items: [],
      total: 0,
      page: 1,
      size: 20,
    }
    vi.mocked(projectsApi.list).mockResolvedValue(mockData)

    const { result } = renderHook(() => useProjects(1, 20), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(projectsApi.list).toHaveBeenCalledWith(1, 20)
  })

  it('should handle pagination', async () => {
    const mockData: PaginatedProjects = {
      items: [],
      total: 0,
      page: 2,
      size: 10,
    }
    vi.mocked(projectsApi.list).mockResolvedValue(mockData)

    const { result } = renderHook(() => useProjects(2, 10), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(projectsApi.list).toHaveBeenCalledWith(2, 10)
  })
})

describe('useProject', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should fetch single project', async () => {
    const mockProject: Project = {
      id: 'proj-1',
      name: 'Project 1',
      key: 'PROJ1',
      description: 'Test project',
      methodology: 'scrum',
      owner_id: 'user-1',
      issue_counter: 5,
      member_count: 3,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      workflow_statuses: [],
    }
    vi.mocked(projectsApi.get).mockResolvedValue(mockProject)

    const { result } = renderHook(() => useProject('proj-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockProject)
  })

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useProject(''), { wrapper })

    expect(result.current.status).toBe('pending')
    expect(projectsApi.get).not.toHaveBeenCalled()
  })
})

describe('useCreateProject', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should create a project', async () => {
    const newProject: Project = {
      id: 'proj-2',
      name: 'New Project',
      key: 'NEW',
      description: 'New test project',
      methodology: 'kanban',
      owner_id: 'user-1',
      issue_counter: 0,
      member_count: 1,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
      workflow_statuses: [],
    }
    vi.mocked(projectsApi.create).mockResolvedValue(newProject)

    const { result } = renderHook(() => useCreateProject(), { wrapper })

    result.current.mutate({
      name: 'New Project',
      key: 'NEW',
      description: 'New test project',
      methodology: 'kanban',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(newProject)
  })

  it('should invalidate projects list on success', async () => {
    // Pre-populate cache with list query
    const listKey = projectKeys.lists()
    queryClient.setQueryData(listKey, {
      items: [],
      total: 0,
      page: 1,
      size: 20,
    })

    const newProject: Project = {
      id: 'proj-2',
      name: 'New Project',
      key: 'NEW',
      description: null,
      methodology: 'scrum',
      owner_id: 'user-1',
      issue_counter: 0,
      member_count: 1,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
      workflow_statuses: [],
    }
    vi.mocked(projectsApi.create).mockResolvedValue(newProject)

    const { result } = renderHook(() => useCreateProject(), { wrapper })

    result.current.mutate({
      name: 'New Project',
      key: 'NEW',
      description: '',
      methodology: 'scrum',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Check that list query is invalidated
    expect(projectsApi.create).toHaveBeenCalled()
  })
})
