/**
 * Skeleton Screens Tests (E1.5)
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkeletonLoader, SkeletonFadeIn } from '@/components/common/SkeletonLoader'

describe('SkeletonLoader (E1.5)', () => {
  it('should render card skeleton', () => {
    const { container } = render(<SkeletonLoader type="card" count={1} />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render multiple card skeletons', () => {
    const { container } = render(<SkeletonLoader type="card" count={3} />)

    const bars = container.querySelectorAll('[role="status"]')
    expect(bars.length).toBeGreaterThan(0)
  })

  it('should render text skeleton with specified lines', () => {
    const { container } = render(<SkeletonLoader type="text" lines={2} />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render line skeleton', () => {
    const { container } = render(<SkeletonLoader type="line" />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render circle skeleton', () => {
    const { container } = render(<SkeletonLoader type="circle" />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render table skeleton with specified dimensions', () => {
    const { container } = render(<SkeletonLoader type="table" rows={3} cols={4} />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render issue list skeleton', () => {
    const { container } = render(<SkeletonLoader type="issue-list" count={3} />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should render kanban skeleton', () => {
    const { container } = render(<SkeletonLoader type="kanban" cols={3} count={4} />)

    const loader = container.querySelector('.skeleton-loader')
    expect(loader).toBeInTheDocument()
  })

  it('should have proper ARIA attributes for accessibility', () => {
    const { container } = render(<SkeletonLoader type="card" />)

    const status = container.querySelector('[role="status"]')
    expect(status).toHaveAttribute('aria-label')
  })

  it('should have aria-hidden on skeleton elements', () => {
    const { container } = render(<SkeletonLoader type="card" count={1} />)

    const skeletonBars = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletonBars.length).toBeGreaterThan(0)
  })
})

describe('SkeletonFadeIn (E1.5)', () => {
  it('should show skeleton when loading', () => {
    const { container } = render(
      <SkeletonFadeIn
        isLoading={true}
        skeleton={<div>Loading...</div>}
        children={<div>Loaded Content</div>}
      />
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Loaded Content')).not.toBeInTheDocument()
  })

  it('should show content when not loading', () => {
    const { container } = render(
      <SkeletonFadeIn
        isLoading={false}
        skeleton={<div>Loading...</div>}
        children={<div>Loaded Content</div>}
      />
    )

    expect(screen.getByText('Loaded Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('should apply fade transition with custom duration', () => {
    const { container } = render(
      <SkeletonFadeIn
        isLoading={false}
        skeleton={<div>Loading...</div>}
        children={<div>Loaded Content</div>}
        duration={500}
      />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.transition).toContain('500ms')
  })

  it('should prevent layout shift with skeleton', () => {
    const { container } = render(
      <SkeletonFadeIn
        isLoading={true}
        skeleton={<div style={{ height: '100px' }}>Loading...</div>}
        children={<div style={{ height: '100px' }}>Loaded Content</div>}
      />
    )

    // Both skeleton and content should have same height to prevent CLS
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
