import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnvironmentCheck } from './EnvironmentCheck'
import { envApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  envApi: { check: vi.fn() },
}))

const check = vi.mocked(envApi.check)

describe('EnvironmentCheck', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
    check.mockReset()
  })

  it('completes after a successful check and persists the result', async () => {
    vi.useFakeTimers()
    check.mockResolvedValue({ data: { success: true, message: 'ready' } } as never)
    const onCheckComplete = vi.fn()
    render(<StrictMode><EnvironmentCheck onCheckComplete={onCheckComplete} /></StrictMode>)

    await act(async () => undefined)
    expect(screen.getByText(/ready|就绪/i)).toBeInTheDocument()
    expect(localStorage.getItem('mediacrawler_env_checked')).toBe('true')
    act(() => vi.advanceTimersByTime(1500))
    expect(onCheckComplete).toHaveBeenCalledWith(true)
  })

  it('allows retry after a failed check', async () => {
    const user = userEvent.setup()
    check
      .mockResolvedValueOnce({ data: { success: false, message: 'missing uv', error: 'install uv' } } as never)
      .mockResolvedValueOnce({ data: { success: true, message: 'ready' } } as never)
    render(<EnvironmentCheck onCheckComplete={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /重试|retry/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /重试|retry/i }))
    await waitFor(() => expect(screen.getAllByText(/ready|就绪/i)).not.toHaveLength(0))
    expect(check).toHaveBeenCalledTimes(2)
  })

  it('cleans up the delayed callback when unmounted', async () => {
    vi.useFakeTimers()
    check.mockResolvedValue({ data: { success: true, message: 'ready' } } as never)
    const onCheckComplete = vi.fn()
    const { unmount } = render(<EnvironmentCheck onCheckComplete={onCheckComplete} />)

    await act(async () => undefined)
    expect(screen.getByText(/ready|就绪/i)).toBeInTheDocument()
    unmount()
    vi.advanceTimersByTime(2000)
    expect(onCheckComplete).not.toHaveBeenCalled()
  })
})
