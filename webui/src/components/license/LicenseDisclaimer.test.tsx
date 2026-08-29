import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LicenseDisclaimer } from './LicenseDisclaimer'

describe('LicenseDisclaimer', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders a forced modal and cannot be dismissed with Escape', async () => {
    const user = userEvent.setup()
    render(<LicenseDisclaimer onAccept={vi.fn()} />)

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: /使用条款|Usage Notice/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })

  it('accepts the terms without replacing the document body', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    const bodyMarker = document.createElement('div')
    bodyMarker.id = 'body-marker'
    document.body.append(bodyMarker)
    render(<LicenseDisclaimer onAccept={onAccept} />)

    await user.click(screen.getByRole('button', { name: /^(我已知晓并同意上述条款|I understand and agree to the above terms)$/i }))

    expect(onAccept).toHaveBeenCalledOnce()
    expect(localStorage.getItem('mediacrawler_license_accepted')).toBe('true')
    expect(document.getElementById('body-marker')).toBe(bodyMarker)
  })

  it('shows a React-rendered declined state', async () => {
    const user = userEvent.setup()
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined)
    render(<LicenseDisclaimer onAccept={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^(不同意，退出|Disagree, Exit)$/i }))

    expect(close).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
