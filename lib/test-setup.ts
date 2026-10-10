import { vi } from 'vitest'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Global mock voor fetch
beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
})
