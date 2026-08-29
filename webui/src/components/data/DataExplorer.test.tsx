import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'
import { dataApi, type DataFile } from '@/lib/api'
import { DataExplorer } from './DataExplorer'

vi.mock('@/lib/api', () => ({
  dataApi: { getFiles: vi.fn() },
}))

vi.mock('./FileCard', () => ({
  FileCard: ({ file }: { file: DataFile }) => <div>{file.name}</div>,
}))

const getFiles = vi.mocked(dataApi.getFiles)
const file: DataFile = {
  name: 'search_notes_2026.json',
  path: 'xhs/search_notes_2026.json',
  size: 128,
  modified_at: 1,
  record_count: 2,
  type: 'json',
}

function renderExplorer() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <DataExplorer />
    </QueryClientProvider>,
  )
}

describe('DataExplorer query states', () => {
  beforeEach(async () => {
    getFiles.mockReset()
    await i18n.changeLanguage('zh-CN')
  })

  it('shows loading and a confirmed empty state separately', async () => {
    getFiles.mockResolvedValue({ data: { files: [] } } as never)
    renderExplorer()

    expect(screen.getByText(/正在扫描数据目录/)).toBeInTheDocument()
    expect(await screen.findByText('暂无数据')).toBeInTheDocument()
  })

  it('shows an error instead of an empty state and recovers on retry', async () => {
    const user = userEvent.setup()
    getFiles
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ data: { files: [file] } } as never)
    renderExplorer()

    expect(await screen.findByRole('alert')).toHaveTextContent('数据目录扫描失败')
    expect(screen.queryByText('暂无数据')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '重试扫描' }))
    expect(await screen.findByText(file.name)).toBeInTheDocument()
  })

  it('keeps cached files visible when a rescan fails', async () => {
    const user = userEvent.setup()
    getFiles
      .mockResolvedValueOnce({ data: { files: [file] } } as never)
      .mockRejectedValueOnce(new Error('rescan failed'))
    renderExplorer()

    expect(await screen.findByText(file.name)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重新扫描' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('数据可能已过期'))
    expect(screen.getByText(file.name)).toBeInTheDocument()
    expect(screen.queryByText('暂无数据')).not.toBeInTheDocument()
  })

  it('uses English error copy when English is active', async () => {
    await i18n.changeLanguage('en-US')
    getFiles.mockRejectedValue(new Error('network unavailable'))
    renderExplorer()

    expect(await screen.findByRole('alert')).toHaveTextContent('DATA SCAN FAILED')
  })
})
