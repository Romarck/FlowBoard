import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from '../date'

describe('formatRelativeTime', () => {
  let mockNow: Date

  beforeEach(() => {
    // Fix current time for consistent testing
    mockNow = new Date('2024-01-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockNow)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return "now" for current time', () => {
    const result = formatRelativeTime('2024-01-15T12:00:00Z')
    expect(result).toBe('now')
  })

  it('should return "now" for future dates', () => {
    const futureDate = new Date(mockNow.getTime() + 60000).toISOString()
    const result = formatRelativeTime(futureDate)
    expect(result).toBe('now')
  })

  it('should format seconds ago', () => {
    const secondsAgo30 = new Date(mockNow.getTime() - 30000).toISOString()
    const result = formatRelativeTime(secondsAgo30)
    expect(result).toBe('30 seconds ago')
  })

  it('should format 1 second ago with singular form', () => {
    const secondAgo1 = new Date(mockNow.getTime() - 1000).toISOString()
    const result = formatRelativeTime(secondAgo1)
    expect(result).toBe('1 second ago')
  })

  it('should format minutes ago', () => {
    const minutesAgo30 = new Date(mockNow.getTime() - 30 * 60000).toISOString()
    const result = formatRelativeTime(minutesAgo30)
    expect(result).toBe('30 minutes ago')
  })

  it('should format 1 minute ago with singular form', () => {
    const minuteAgo1 = new Date(mockNow.getTime() - 60000).toISOString()
    const result = formatRelativeTime(minuteAgo1)
    expect(result).toBe('1 minute ago')
  })

  it('should format hours ago', () => {
    const hoursAgo5 = new Date(mockNow.getTime() - 5 * 3600000).toISOString()
    const result = formatRelativeTime(hoursAgo5)
    expect(result).toBe('5 hours ago')
  })

  it('should format 1 hour ago with singular form', () => {
    const hourAgo1 = new Date(mockNow.getTime() - 3600000).toISOString()
    const result = formatRelativeTime(hourAgo1)
    expect(result).toBe('1 hour ago')
  })

  it('should format days ago', () => {
    const daysAgo3 = new Date(mockNow.getTime() - 3 * 86400000).toISOString()
    const result = formatRelativeTime(daysAgo3)
    expect(result).toBe('3 days ago')
  })

  it('should format 1 day ago with singular form', () => {
    const dayAgo1 = new Date(mockNow.getTime() - 86400000).toISOString()
    const result = formatRelativeTime(dayAgo1)
    expect(result).toBe('1 day ago')
  })

  it('should format weeks ago', () => {
    const weeksAgo2 = new Date(mockNow.getTime() - 2 * 7 * 86400000).toISOString()
    const result = formatRelativeTime(weeksAgo2)
    expect(result).toBe('2 weeks ago')
  })

  it('should format 1 week ago with singular form', () => {
    const weekAgo1 = new Date(mockNow.getTime() - 7 * 86400000).toISOString()
    const result = formatRelativeTime(weekAgo1)
    expect(result).toBe('1 week ago')
  })

  it('should format months ago', () => {
    const monthsAgo5 = new Date(mockNow.getTime() - 5 * 30 * 86400000).toISOString()
    const result = formatRelativeTime(monthsAgo5)
    expect(result).toBe('5 months ago')
  })

  it('should format 1 month ago with singular form', () => {
    const monthAgo1 = new Date(mockNow.getTime() - 30 * 86400000).toISOString()
    const result = formatRelativeTime(monthAgo1)
    expect(result).toBe('1 month ago')
  })

  it('should format years ago', () => {
    const yearsAgo2 = new Date(mockNow.getTime() - 2 * 365 * 86400000).toISOString()
    const result = formatRelativeTime(yearsAgo2)
    expect(result).toBe('2 years ago')
  })

  it('should format 1 year ago with singular form', () => {
    const yearAgo1 = new Date(mockNow.getTime() - 365 * 86400000).toISOString()
    const result = formatRelativeTime(yearAgo1)
    expect(result).toBe('1 year ago')
  })
})
