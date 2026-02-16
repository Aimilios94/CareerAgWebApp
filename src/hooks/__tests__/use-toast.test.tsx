import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast } from '../use-toast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add toast to state', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].description).toBe('Test description')
  })

  it('should generate unique id for each toast', () => {
    const { result } = renderHook(() => useToast())

    let id1: string
    let id2: string
    act(() => {
      const toast1 = result.current.toast({ title: 'Toast 1' })
      id1 = toast1.id
      const toast2 = result.current.toast({ title: 'Toast 2' })
      id2 = toast2.id
    })

    // IDs should be unique even though only 1 toast is kept
    expect(id1!).not.toBe(id2!)
  })

  it('should support destructive variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Error',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })

  it('should support action in toast', () => {
    const { result } = renderHook(() => useToast())
    const mockAction = <button>Click me</button>

    act(() => {
      result.current.toast({
        title: 'With Action',
        action: mockAction,
      })
    })

    expect(result.current.toasts[0].action).toBe(mockAction)
  })

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string
    act(() => {
      const { id } = result.current.toast({ title: 'To Dismiss' })
      toastId = id
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId!)
    })

    // Toast should be marked for removal (open = false)
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('should dismiss all toasts when called without id', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss()
    })

    // Toast should be marked for removal
    expect(result.current.toasts.every((t) => t.open === false)).toBe(true)
  })

  it('should limit number of toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    // Should only keep TOAST_LIMIT (1) toast visible
    expect(result.current.toasts.length).toBeLessThanOrEqual(1)
  })

  it('should export standalone toast function', () => {
    expect(typeof toast).toBe('function')
  })

  it('should update existing toast by id', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string
    act(() => {
      const { id, update } = result.current.toast({ title: 'Original' })
      toastId = id
      update({ title: 'Updated' })
    })

    const updatedToast = result.current.toasts.find((t) => t.id === toastId)
    expect(updatedToast?.title).toBe('Updated')
  })
})
