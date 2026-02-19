import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIssues, useCreateIssue, useIssue, issueKeys } from '../useIssues'
import { issueApi, type IssueListResponse, type IssueListItem } from '@/api/issues'
import type { CreateIssueRequest, Issue } from '@/types/issue'
import React, { ReactNode } from 'react'

// Mock the API
vi.mock('@/api/issues', () => ({
  issueApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    move: vi.fn(),
    search: vi.fn(),
  },
}))

describe('useIssues', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should fetch issues for a project', async () => {
    const mockData: IssueListResponse = {
      items: [
        {
          id: 'issue-1',
          project_id: 'proj-1',
          key: 'PROJ-1',
          title: 'Test issue',
          type: 'bug',
          priority: 'high',
          status: { id: 'status-1', name: 'To Do', category: 'todo' },
          assignee: { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatar_url: null },
          story_points: 5,
          label_count: 0,
          created_at: '2024-01-01T10:00:00Z',
        } as IssueListItem,
      ],
      total: 1,
      page: 1,
      size: 20,
    }
    vi.mocked(issueApi.list).mockResolvedValue(mockData)

    const { result } = renderHook(() => useIssues('proj-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(issueApi.list).toHaveBeenCalledWith('proj-1', undefined)
  })

  it('should not fetch when projectId is empty', () => {
    const { result } = renderHook(() => useIssues(''), { wrapper })

    expect(result.current.status).toBe('pending')
    expect(issueApi.list).not.toHaveBeenCalled()
  })

  it('should pass filters to API', async () => {
    const mockData: IssueListResponse = {
      items: [],
      total: 0,
      page: 1,
      size: 20,
    }
    vi.mocked(issueApi.list).mockResolvedValue(mockData)

    const filters = { status_id: 'status-1' }
    const { result } = renderHook(() => useIssues('proj-1', filters), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(issueApi.list).toHaveBeenCalledWith('proj-1', filters)
  })
})

describe('useIssue', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should fetch single issue', async () => {
    const mockIssue = {
      id: 'issue-1',
      project_id: 'proj-1',
      key: 'PROJ-1',
      title: 'Test issue',
      type: 'bug' as const,
      priority: 'high' as const,
      status_id: 'status-1',
      status: { id: 'status-1', name: 'To Do', category: 'todo' as const, position: 0, wip_limit: null },
      description: null,
      assignee_id: 'user-1',
      assignee: { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatar_url: null, role: 'developer', created_at: '2024-01-01T10:00:00Z' },
      reporter_id: 'user-1',
      reporter: { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatar_url: null, role: 'developer', created_at: '2024-01-01T10:00:00Z' },
      sprint_id: null,
      parent_id: null,
      story_points: 5,
      due_date: null,
      position: 0,
      labels: [],
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    } as Issue
    vi.mocked(issueApi.get).mockResolvedValue(mockIssue)

    const { result } = renderHook(() => useIssue('proj-1', 'issue-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockIssue)
  })

  it('should not fetch when projectId or issueId is empty', () => {
    const { result: result1 } = renderHook(() => useIssue('', 'issue-1'), { wrapper })
    const { result: result2 } = renderHook(() => useIssue('proj-1', ''), { wrapper })

    expect(result1.current.status).toBe('pending')
    expect(result2.current.status).toBe('pending')
    expect(issueApi.get).not.toHaveBeenCalled()
  })
})

describe('useCreateIssue', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should create an issue', async () => {
    const newIssue = {
      id: 'issue-2',
      project_id: 'proj-1',
      key: 'PROJ-2',
      title: 'New issue',
      type: 'story' as const,
      priority: 'medium' as const,
      status_id: 'status-1',
      status: { id: 'status-1', name: 'To Do', category: 'todo' as const, position: 0, wip_limit: null },
      description: null,
      assignee_id: null,
      assignee: null,
      reporter_id: 'user-1',
      reporter: { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatar_url: null, role: 'developer', created_at: '2024-01-01T10:00:00Z' },
      sprint_id: null,
      parent_id: null,
      story_points: 3,
      due_date: null,
      position: 0,
      labels: [],
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    } as Issue
    vi.mocked(issueApi.create).mockResolvedValue(newIssue)

    const { result } = renderHook(() => useCreateIssue('proj-1'), { wrapper })

    const createData: CreateIssueRequest = {
      title: 'New issue',
      type: 'story',
      priority: 'medium',
      story_points: 3,
    }

    result.current.mutate(createData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(newIssue)
    expect(issueApi.create).toHaveBeenCalledWith('proj-1', createData)
  })

  it('should invalidate issues list on success', async () => {
    // Pre-populate cache with list query
    const listKey = issueKeys.byProject('proj-1')
    queryClient.setQueryData(listKey, {
      items: [],
      total: 0,
      page: 1,
      size: 20,
    })

    const newIssue: Issue = {
      id: 'issue-2',
      key: 'PROJ-2',
      title: 'New issue',
      type: 'story',
      priority: 'medium',
      status_id: 'status-1',
      assignee_id: null,
      story_points: 3,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    }
    vi.mocked(issueApi.create).mockResolvedValue(newIssue)

    const { result } = renderHook(() => useCreateIssue('proj-1'), { wrapper })

    const createData: CreateIssueRequest = {
      title: 'New issue',
      type: 'story',
      priority: 'medium',
    }

    result.current.mutate(createData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(issueApi.create).toHaveBeenCalled()
  })
})
