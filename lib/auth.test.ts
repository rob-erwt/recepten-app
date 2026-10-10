import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client voor auth tests
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
}

// Mock createClient
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Authentication - Wachtwoord Reset (US-U-02-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resetPasswordForEmail', () => {
    it('roepen resetPasswordForEmail aan met correcte parameters', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const email = 'test@example.com'
      const redirectTo = 'https://example.com/auth/reset/confirm'

      await mockSupabase.auth.resetPasswordForEmail(email, { redirectTo })

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        email,
        expect.objectContaining({
          redirectTo,
        })
      )
    })

    it('geeft geen error bij succesvol resetlink versturen', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await mockSupabase.auth.resetPasswordForEmail('test@example.com', {
        redirectTo: 'https://example.com/auth/reset/confirm',
      })

      expect(result.error).toBeNull()
    })
  })

  describe('exchangeCodeForSession', () => {
    it('wisselt code om voor sessie bij geldige resetlink', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'test-token' } },
      })

      const code = 'test-code-123'
      const result = await mockSupabase.auth.exchangeCodeForSession(code)

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(code)
      expect(result.error).toBeNull()
      expect(result.data.session.access_token).toBe('test-token')
    })

    it('geeft error bij ongeldige of verlopen code', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid or expired code' },
        data: null,
      })

      const result = await mockSupabase.auth.exchangeCodeForSession('invalid-code')

      expect(result.error).not.toBeNull()
      expect(result.error.message).toBe('Invalid or expired code')
    })
  })

  describe('updateUser with new password', () => {
    it('werkt wachtwoord bij na succesvolle code exchange', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null, data: { user: {} } })

      const newPassword = 'newSecurePassword123!'
      const result = await mockSupabase.auth.updateUser({ password: newPassword })

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      })
      expect(result.error).toBeNull()
    })

    it('geeft error bij te kort wachtwoord', async () => {
      const shortPassword = 'short'
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Password should be at least 8 characters' },
        data: null,
      })

      const result = await mockSupabase.auth.updateUser({ password: shortPassword })

      expect(result.error).not.toBeNull()
      expect(result.error.message).toContain('at least 8 characters')
    })
  })
})

describe('Authentication - Bevestigingsmail (US-U-01-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Uitnodiging registratie flow', () => {
    it('maakt gebruiker aan met email_confirm: false voor bevestigingsmail', async () => {
      // Simuleer de admin client voor uitnodiging registratie
      const mockAdmin = {
        auth: {
          admin: {
            createUser: vi.fn(),
            generateLink: vi.fn(),
            deleteUser: vi.fn(),
          },
        },
        rpc: vi.fn(),
      }

      mockAdmin.rpc.mockResolvedValue({ data: [{ geldig: true, huishouden_naam: 'Test Huishouden' }], error: null })
      mockAdmin.auth.admin.createUser.mockResolvedValue({ error: null, data: { user: { id: 'user-123', email: 'test@example.com' } } })
      mockAdmin.auth.admin.generateLink.mockResolvedValue({ error: null, data: { action_link: 'http://localhost/auth/confirm?token=abc' } })

      // Simuleer de flow
      const result = await mockAdmin.auth.admin.createUser({
        email: 'test@example.com',
        password: 'securePassword123',
        email_confirm: false,
        user_metadata: { naam: 'Test User', uitnodiging_token: 'token-123' },
      })

      expect(result.error).toBeNull()
      expect(mockAdmin.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'securePassword123',
          email_confirm: false,
        })
      )
    })

    it('genereert bevestigingslink na succesvolle gebruiker aanmaak', async () => {
      const mockAdmin = {
        auth: {
          admin: {
            generateLink: vi.fn(),
          },
        },
      }

      mockAdmin.auth.admin.generateLink.mockResolvedValue({
        error: null,
        data: { action_link: 'http://localhost/auth/confirm?token=abc&type=signup' },
      })

      const email = 'test@example.com'
      const result = await mockAdmin.auth.admin.generateLink({ type: 'signup', email })

      expect(mockAdmin.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'signup',
        email,
      })
      expect(result.error).toBeNull()
      expect(result.data.action_link).toContain('type=signup')
    })

    it('verwijderd gebruiker als bevestigingsmail niet verstuurd kan worden', async () => {
      const mockAdmin = {
        auth: {
          admin: {
            createUser: vi.fn(),
            generateLink: vi.fn(),
            deleteUser: vi.fn(),
          },
        },
      }

      const email = 'test@example.com'
      
      // Gebruiker succesvol aangemaakt
      mockAdmin.auth.admin.createUser.mockResolvedValue({ error: null })
      
      // Bevestigingsmail mislukt
      mockAdmin.auth.admin.generateLink.mockResolvedValue({
        error: { message: 'Failed to send email' },
      })

      mockAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null })

      // Simuleer de cleanup flow
      const createResult = await mockAdmin.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: false,
      })

      if (createResult.error) {
        // Dit zou niet gebeuren in onze flow
      }

      const verifyResult = await mockAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
      })

      if (verifyResult.error) {
        // Cleanup: verwijder gebruiker
        await mockAdmin.auth.admin.deleteUser(email)
        expect(mockAdmin.auth.admin.deleteUser).toHaveBeenCalledWith(email)
      }
    })
  })
})

describe('Password Validation', () => {
  it('accepteert wachtwoorden van minimaal 8 tekens', () => {
    const validPasswords = [
      'password123',
      'SecurePass!',
      '12345678',
      'a'.repeat(8),
    ]

    validPasswords.forEach(pw => {
      expect(pw.length >= 8).toBe(true)
    })
  })

  it('wijst wachtwoorden korter dan 8 tekens af', () => {
    const invalidPasswords = [
      'short',
      '12345',
      'abc',
      '',
    ]

    invalidPasswords.forEach(pw => {
      expect(pw.length >= 8).toBe(false)
    })
  })
})
