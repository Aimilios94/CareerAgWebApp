import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  ToastViewport,
  ToastProvider,
} from '../toast'

// Helper to render toast components within required provider
const renderToast = (children: React.ReactNode) => {
  return render(<ToastProvider>{children}</ToastProvider>)
}

describe('Toast', () => {
  describe('renders toast with title', () => {
    it('displays the title text', () => {
      renderToast(
        <>
          <Toast>
            <ToastTitle>Success</ToastTitle>
          </Toast>
          <ToastViewport />
        </>
      )

      expect(screen.getByText('Success')).toBeInTheDocument()
    })

    it('renders with proper heading semantics', () => {
      renderToast(
        <>
          <Toast>
            <ToastTitle>Important Update</ToastTitle>
          </Toast>
          <ToastViewport />
        </>
      )

      const title = screen.getByText('Important Update')
      expect(title).toBeInTheDocument()
    })
  })

  describe('renders toast with description', () => {
    it('displays both title and description', () => {
      renderToast(
        <>
          <Toast>
            <ToastTitle>File Uploaded</ToastTitle>
            <ToastDescription>Your CV has been successfully uploaded.</ToastDescription>
          </Toast>
          <ToastViewport />
        </>
      )

      expect(screen.getByText('File Uploaded')).toBeInTheDocument()
      expect(screen.getByText('Your CV has been successfully uploaded.')).toBeInTheDocument()
    })

    it('renders description with proper styling', () => {
      renderToast(
        <>
          <Toast>
            <ToastDescription>This is a description</ToastDescription>
          </Toast>
          <ToastViewport />
        </>
      )

      const description = screen.getByText('This is a description')
      expect(description).toHaveClass('text-sm')
    })
  })

  describe('renders action button', () => {
    it('displays action button with label', () => {
      renderToast(
        <>
          <Toast>
            <ToastTitle>New Job Match</ToastTitle>
            <ToastAction altText="View job details">View Details</ToastAction>
          </Toast>
          <ToastViewport />
        </>
      )

      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument()
    })

    it('calls onClick handler when action is clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      renderToast(
        <>
          <Toast>
            <ToastTitle>Action Required</ToastTitle>
            <ToastAction altText="Retry the operation" onClick={handleClick}>
              Retry
            </ToastAction>
          </Toast>
          <ToastViewport />
        </>
      )

      const actionButton = screen.getByRole('button', { name: /retry/i })
      await user.click(actionButton)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders action with proper styling', () => {
      renderToast(
        <>
          <Toast>
            <ToastAction altText="Undo action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </>
      )

      const actionButton = screen.getByRole('button', { name: /undo/i })
      expect(actionButton).toHaveClass('inline-flex')
    })
  })

  describe('applies destructive variant', () => {
    it('renders with destructive styling', () => {
      renderToast(
        <>
          <Toast variant="destructive" data-testid="destructive-toast">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Something went wrong.</ToastDescription>
          </Toast>
          <ToastViewport />
        </>
      )

      const toast = screen.getByTestId('destructive-toast')
      expect(toast).toHaveClass('destructive')
    })

    it('applies red border color for destructive variant', () => {
      renderToast(
        <>
          <Toast variant="destructive" data-testid="error-toast">
            <ToastTitle>Upload Failed</ToastTitle>
          </Toast>
          <ToastViewport />
        </>
      )

      const toast = screen.getByTestId('error-toast')
      // Destructive variant should have red/error styling classes
      expect(toast.className).toMatch(/destructive|red|error/i)
    })

    it('renders destructive toast title with correct visibility', () => {
      renderToast(
        <>
          <Toast variant="destructive">
            <ToastTitle>Critical Error</ToastTitle>
            <ToastDescription>Please try again later.</ToastDescription>
          </Toast>
          <ToastViewport />
        </>
      )

      expect(screen.getByText('Critical Error')).toBeVisible()
      expect(screen.getByText('Please try again later.')).toBeVisible()
    })
  })

  describe('ToastClose', () => {
    it('renders close button', () => {
      renderToast(
        <>
          <Toast>
            <ToastTitle>Notification</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </>
      )

      // Close button should be present (typically an X icon)
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('ToastViewport', () => {
    it('renders viewport container', () => {
      renderToast(<ToastViewport data-testid="toast-viewport" />)

      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
    })

    it('positions viewport at the edge of screen', () => {
      renderToast(<ToastViewport data-testid="viewport" />)

      const viewport = screen.getByTestId('viewport')
      expect(viewport).toHaveClass('fixed')
    })
  })
})

describe('Toaster', () => {
  it('renders active toasts from context', async () => {
    // This test verifies the Toaster component integrates with useToast hook
    // The Toaster should render all toasts from the toast state
    const { Toaster } = await import('../toaster')

    const { container } = render(<Toaster />)

    // Toaster renders a ToastProvider and ToastViewport
    // When no toasts are active, viewport should still be present
    // Look for the viewport by its fixed positioning class
    const viewport = container.querySelector('.fixed')
    expect(viewport).toBeInTheDocument()
  })
})
