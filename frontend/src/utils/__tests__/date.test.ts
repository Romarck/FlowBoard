import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from '../date'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock current time to 2024-01-15T10:00:00Z for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "now" for future dates', () => {
    const futureDate = new Date('2024-01-15T10:00:01Z').toISOString()
    expect(formatRelativeTime(futureDate)).toBe('now')
  })

  it('should return "now" for dates 0 seconds ago', () => {
    const now = new Date('2024-01-15T10:00:00Z').toISOString()
    expect(formatRelativeTime(now)).toBe('now')
  })

  it('should format seconds correctly', () => {
    const secondsAgo = new Date('2024-01-15T09:59:30Z').toISOString()
    expect(formatRelativeTime(secondsAgo)).toBe('30 seconds ago')
  })

  it('should format singular second correctly', () => {
    const oneSecondAgo = new Date('2024-01-15T09:59:59Z').toISOString()
    expect(formatRelativeTime(oneSecondAgo)).toBe('1 second ago')
  })

  it('should format minutes correctly', () => {
    const minutesAgo = new Date('2024-01-15T09:45:00Z').toISOString()
    expect(formatRelativeTime(minutesAgo)).toBe('15 minutes ago')
  })

  it('should format singular minute correctly', () => {
    const oneMinuteAgo = new Date('2024-01-15T09:59:00Z').toISOString()
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago')
  })

  it('should format hours correctly', () => {
    const hoursAgo = new Date('2024-01-15T07:00:00Z').toISOString()
    expect(formatRelativeTime(hoursAgo)).toBe('3 hours ago')
  })

  it('should format singular hour correctly', () => {
    const oneHourAgo = new Date('2024-01-15T09:00:00Z').toISOString()
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
  })

  it('should format days correctly', () => {
    const daysAgo = new Date('2024-01-10T10:00:00Z').toISOString()
    expect(formatRelativeTime(daysAgo)).toBe('5 days ago')
  })

  it('should format singular day correctly', () => {
    const oneDayAgo = new Date('2024-01-14T10:00:00Z').toISOString()
    expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago')
  })

  it('should format weeks correctly', () => {
    const weeksAgo = new Date('2024-01-01T10:00:00Z').toISOString()
    expect(formatRelativeTime(weeksAgo)).toBe('2 weeks ago')
  })

  it('should format singular week correctly', () => {
    const oneWeekAgo = new Date('2024-01-08T10:00:00Z').toISOString()
    expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago')
  })

  it('should format months correctly', () => {
    const monthsAgo = new Date('2023-11-15T10:00:00Z').toISOString()
    expect(formatRelativeTime(monthsAgo)).toBe('2 months ago')
  })

  it('should format singular month correctly', () => {
    const oneMonthAgo = new Date('2023-12-15T10:00:00Z').toISOString()
    expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago')
  })

  it('should format years correctly', () => {
    const yearsAgo = new Date('2022-01-15T10:00:00Z').toISOString()
    expect(formatRelativeTime(yearsAgo)).toBe('2 years ago')
  })

  it('should format singular year correctly', () => {
    const oneYearAgo = new Date('2023-01-15T10:00:00Z').toISOString()
    expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago')
  })
})
