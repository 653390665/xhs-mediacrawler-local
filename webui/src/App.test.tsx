import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('@/components/license/LicenseDisclaimer', () => ({
  LicenseDisclaimer: ({ onAccept }: { onAccept: () => void }) => (
    <div role="dialog" data-testid="license-gate">
      <button onClick={onAccept}>accept license</button>
    </div>
  ),
  isLicenseAccepted: () => localStorage.getItem('mediacrawler_license_accepted') === 'true',
}))

vi.mock('@/components/env/EnvironmentCheck', () => ({
  EnvironmentCheck: ({ onCheckComplete }: { onCheckComplete: (success: boolean) => void }) => (
    <div role="dialog" data-testid="environment-gate">
      <button onClick={() => onCheckComplete(true)}>complete environment</button>
    </div>
  ),
  isEnvChecked: () => localStorage.getItem('mediacrawler_env_checked') === 'true',
}))

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: ({ onShowDisclaimer }: { onShowDisclaimer?: () => void }) => (
    <button onClick={onShowDisclaimer}>show disclaimer</button>
  ),
}))
vi.mock('@/components/config/CrawlerConfigPanel', () => ({
  CrawlerConfigPanel: () => <div data-testid="workspace">crawler config</div>,
}))
vi.mock('@/components/layout/MainContent', () => ({ MainContent: () => <div>main content</div> }))
vi.mock('@/components/layout/AuthorFooter', () => ({ AuthorFooter: () => <footer>footer</footer> }))

describe('App startup gates', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('hides the workspace until the license is accepted', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByTestId('license-gate')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'accept license' }))
    expect(screen.getByTestId('environment-gate')).toBeInTheDocument()
  })

  it('hides the workspace while environment check is incomplete', async () => {
    localStorage.setItem('mediacrawler_license_accepted', 'true')
    render(<App />)

    expect(screen.getByTestId('environment-gate')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument()
  })

  it('mounts workspace only after both gates pass', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mediacrawler_license_accepted', 'true')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'complete environment' }))
    expect(screen.getByTestId('workspace')).toBeInTheDocument()
  })

  it('hides workspace when disclaimer is reopened', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mediacrawler_license_accepted', 'true')
    localStorage.setItem('mediacrawler_env_checked', 'true')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'show disclaimer' }))
    expect(screen.getByTestId('license-gate')).toBeInTheDocument()
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument()
  })
})
