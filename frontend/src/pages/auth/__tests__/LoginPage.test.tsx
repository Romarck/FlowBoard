import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock react-router-dom before importing LoginPage
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn(),
  }
})

// Mock useAuth hook before importing LoginPage
const mockLogin = vi.fn()
const mockSetError = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    setError: mockSetError,
  }),
}))

// Now import LoginPage after all mocks are set up
import { LoginPage } from '../LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear()
    mockSetError.mockClear()
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign in to FlowBoard')).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to continue')).toBeInTheDocument()
  })

  it('should render email input field', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
  })

  it('should render password input field', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('placeholder', '********')
  })

  it('should render submit button', () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('should render forgot password and register links', () => {
    render(<LoginPage />)

    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
    expect(screen.getByText('Create account')).toBeInTheDocument()
  })

  it('should update email input value', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    await user.type(emailInput, 'test@example.com')

    expect(emailInput.value).toBe('test@example.com')
  })

  it('should update password input value', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    await user.type(passwordInput, 'password123')

    expect(passwordInput.value).toBe('password123')
  })

  it('should have required attributes on inputs', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
  })

  it('should have autocomplete attributes', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    expect(emailInput).toHaveAttribute('autoComplete', 'email')
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
  })

  it('should render form element', () => {
    render(<LoginPage />)

    const form = screen.getByRole('button', { name: /Sign In/i }).closest('form')
    expect(form).toBeInTheDocument()
  })

  it('should have proper page layout', () => {
    const { container } = render(<LoginPage />)

    const outerDiv = container.querySelector('div')
    expect(outerDiv).toHaveClass('flex')
    expect(outerDiv).toHaveClass('min-h-screen')
  })

  it('should render centered card layout', () => {
    const { container } = render(<LoginPage />)

    const card = container.querySelector('div.w-full.max-w-md')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('shadow-sm')
  })
})
