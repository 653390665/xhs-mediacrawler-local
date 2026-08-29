import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n'
import { useCrawlerStatus } from '@/hooks/useCrawler'
import { Sidebar } from './Sidebar'

vi.mock('@/hooks/useCrawler', () => ({ useCrawlerStatus: vi.fn() }))
vi.mock('@/store/crawlerStore', () => ({
  useCrawlerStore: (selector: (state: { status: string }) => unknown) => selector({ status: 'idle' }),
}))
vi.mock('./LanguageSwitch', () => ({ LanguageSwitch: () => null }))
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => null }))

const statusQuery = vi.mocked(useCrawlerStatus)

function setStatusQuery(state: {
  isPending?: boolean
  isError?: boolean
  isSuccess?: boolean
  data?: { status: 'idle'; platform: null; crawler_type: null; started_at: null; error_message: null }
}) {
  statusQuery.mockReturnValue({
    isPending: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    ...state,
  } as ReturnType<typeof useCrawlerStatus>)
}

describe('Sidebar API status', () => {
  beforeEach(async () => {
    statusQuery.mockReset()
    await i18n.changeLanguage('zh-CN')
  })

  it('shows a warning state while status is unconfirmed', () => {
    setStatusQuery({ isPending: true })
    const { container } = render(<Sidebar />)

    expect(screen.getByText('检测中')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-warning')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-online')).not.toBeInTheDocument()
  })

  it('shows unavailable without a green online dot after failure', () => {
    setStatusQuery({ isError: true })
    const { container } = render(<Sidebar />)

    expect(screen.getByText('不可用')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-error')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-online')).not.toBeInTheDocument()
  })

  it('shows online only after a successful status response', () => {
    setStatusQuery({
      isSuccess: true,
      data: { status: 'idle', platform: null, crawler_type: null, started_at: null, error_message: null },
    })
    const { container } = render(<Sidebar />)

    expect(screen.getByText('在线')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-online')).toBeInTheDocument()
  })

  it('updates from unavailable to online after recovery', () => {
    setStatusQuery({ isError: true })
    const { container, rerender } = render(<Sidebar />)
    expect(screen.getByText('不可用')).toBeInTheDocument()

    setStatusQuery({
      isSuccess: true,
      data: { status: 'idle', platform: null, crawler_type: null, started_at: null, error_message: null },
    })
    rerender(<Sidebar />)

    expect(screen.getByText('在线')).toBeInTheDocument()
    expect(container.querySelector('.status-dot-online')).toBeInTheDocument()
  })
})
