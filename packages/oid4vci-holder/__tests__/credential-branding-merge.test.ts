import { describe, expect, it } from 'vitest'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store-types'
import { SdJwtTypeDisplayMetadata } from '@sphereon/ssi-types'
import { sdJwtCredentialLocaleBrandingFrom } from '../src/mappers/OIDC4VCIBrandingMapper'
import { mergeCredentialLocaleBrandings, selectCredentialLocaleBranding } from '../src/services/OID4VCIHolderService'

describe('Credential branding merge logic', () => {
  describe('sdJwtCredentialLocaleBrandingFrom', () => {
    it('should extract background_image from VCT rendering.simple', async () => {
      const display: SdJwtTypeDisplayMetadata = {
        lang: 'en-GB',
        name: 'eduID',
        description: 'eduID indicates affiliation with an institute of higher education or research',
        rendering: {
          simple: {
            text_color: '#ffffff',
            background_color: '#4779aa',
            background_image: {
              uri: 'https://static.dev.eduid.nl/images/eduid_credential_bg.png',
            },
            logo: {
              uri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png',
            },
          },
        },
      }

      const result = await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display })

      expect(result.alias).toBe('eduID')
      expect(result.locale).toBe('en-GB')
      expect(result.logo?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_logo.png')
      expect(result.background?.image?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_bg.png')
      expect(result.background?.color).toBe('#4779aa')
      expect(result.text?.color).toBe('#ffffff')
    })

    it('should extract background_image alt_text when present', async () => {
      const display: SdJwtTypeDisplayMetadata = {
        lang: 'en',
        name: 'Test',
        rendering: {
          simple: {
            background_image: {
              uri: 'https://example.com/bg.png',
              alt_text: 'Background image',
            },
          },
        },
      }

      const result = await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display })

      expect(result.background?.image?.uri).toBe('https://example.com/bg.png')
      expect(result.background?.image?.alt).toBe('Background image')
    })

    it('should handle background_image without background_color', async () => {
      const display: SdJwtTypeDisplayMetadata = {
        lang: 'en',
        name: 'Test',
        rendering: {
          simple: {
            background_image: {
              uri: 'https://example.com/bg.png',
            },
          },
        },
      }

      const result = await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display })

      expect(result.background?.image?.uri).toBe('https://example.com/bg.png')
      expect(result.background?.color).toBeUndefined()
    })

    it('should handle background_color without background_image', async () => {
      const display: SdJwtTypeDisplayMetadata = {
        lang: 'en',
        name: 'Test',
        rendering: {
          simple: {
            background_color: '#000000',
          },
        },
      }

      const result = await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display })

      expect(result.background?.color).toBe('#000000')
      expect(result.background?.image).toBeUndefined()
    })

    it('should handle no background properties', async () => {
      const display: SdJwtTypeDisplayMetadata = {
        lang: 'en',
        name: 'Test',
        rendering: {
          simple: {
            logo: { uri: 'https://example.com/logo.png' },
          },
        },
      }

      const result = await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display })

      expect(result.background).toBeUndefined()
    })
  })

  describe('mergeCredentialLocaleBrandings', () => {
    it('should prefer VCT branding over issuer branding for overlapping fields', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'VCT Name',
          logo: { uri: 'https://vct.example.com/logo.png' },
          background: { color: '#111111', image: { uri: 'https://vct.example.com/bg.png' } },
          text: { color: '#ffffff' },
        },
      ]
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Issuer Name',
          logo: { uri: 'https://issuer.example.com/logo.png' },
          background: { color: '#222222', image: { uri: 'https://issuer.example.com/bg.png' } },
          text: { color: '#000000' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, issuer)

      expect(result).toHaveLength(1)
      expect(result[0].alias).toBe('VCT Name')
      expect(result[0].logo?.uri).toBe('https://vct.example.com/logo.png')
      expect(result[0].background?.image?.uri).toBe('https://vct.example.com/bg.png')
      expect(result[0].background?.color).toBe('#111111')
      expect(result[0].text?.color).toBe('#ffffff')
    })

    it('should fill missing VCT fields from issuer branding', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'VCT Name',
          logo: { uri: 'https://vct.example.com/logo.png' },
          // No background, no text
        },
      ]
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Issuer Name',
          logo: { uri: 'https://issuer.example.com/logo.png' },
          background: { color: '#222222', image: { uri: 'https://issuer.example.com/bg.png' } },
          text: { color: '#000000' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, issuer)

      expect(result).toHaveLength(1)
      // VCT wins for fields it has
      expect(result[0].alias).toBe('VCT Name')
      expect(result[0].logo?.uri).toBe('https://vct.example.com/logo.png')
      // Issuer fills in missing fields
      expect(result[0].background?.image?.uri).toBe('https://issuer.example.com/bg.png')
      expect(result[0].background?.color).toBe('#222222')
      expect(result[0].text?.color).toBe('#000000')
    })

    it('should merge background fields independently (image from VCT, color from issuer)', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test',
          background: { image: { uri: 'https://vct.example.com/bg.png' } },
        },
      ]
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test',
          background: { color: '#222222' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, issuer)

      expect(result).toHaveLength(1)
      expect(result[0].background?.image?.uri).toBe('https://vct.example.com/bg.png')
      expect(result[0].background?.color).toBe('#222222')
    })

    it('should match locales by language prefix (en-GB matches en)', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en-GB',
          alias: 'VCT Name',
          logo: { uri: 'https://vct.example.com/logo.png' },
          background: { image: { uri: 'https://vct.example.com/bg.png' }, color: '#4779aa' },
        },
      ]
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Issuer Name',
          logo: { uri: 'https://issuer.example.com/logo.png' },
          description: 'From issuer',
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, issuer)

      expect(result).toHaveLength(1)
      expect(result[0].locale).toBe('en-GB')
      expect(result[0].alias).toBe('VCT Name')
      expect(result[0].logo?.uri).toBe('https://vct.example.com/logo.png')
      expect(result[0].background?.image?.uri).toBe('https://vct.example.com/bg.png')
      // Filled from issuer
      expect(result[0].description).toBe('From issuer')
    })

    it('should include locales that only exist in secondary', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'English',
          logo: { uri: 'https://vct.example.com/logo.png' },
        },
      ]
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'English Issuer',
        },
        {
          locale: 'de',
          alias: 'German Issuer',
          logo: { uri: 'https://issuer.example.com/logo-de.png' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, issuer)

      expect(result).toHaveLength(2)
      expect(result[0].locale).toBe('en')
      expect(result[0].alias).toBe('English')
      // de comes from issuer only
      const de = result.find((b) => b.locale === 'de')
      expect(de).toBeDefined()
      expect(de?.alias).toBe('German Issuer')
      expect(de?.logo?.uri).toBe('https://issuer.example.com/logo-de.png')
    })

    it('should handle empty secondary array', () => {
      const vct: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test',
          logo: { uri: 'https://vct.example.com/logo.png' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vct, [])

      expect(result).toHaveLength(1)
      expect(result[0].alias).toBe('Test')
    })

    it('should handle empty primary array', () => {
      const issuer: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test',
          logo: { uri: 'https://issuer.example.com/logo.png' },
        },
      ]

      const result = mergeCredentialLocaleBrandings([], issuer)

      expect(result).toHaveLength(1)
      expect(result[0].alias).toBe('Test')
    })

    it('should handle eduID real-world scenario: VCT has background_image, issuer has logo and background_image', () => {
      // Simulates the eduID case: VCT metadata provides logo + background_image via rendering.simple
      // Issuer metadata also provides logo + background_image via credential display
      // VCT should win for all fields it provides
      const vctBranding: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en-GB',
          alias: 'eduID',
          description: 'eduID indicates affiliation with an institute of higher education or research',
          logo: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png' },
          background: {
            image: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_bg.png' },
            color: '#4779aa',
          },
          text: { color: '#ffffff' },
        },
        {
          locale: 'nl-NL',
          alias: 'eduID',
          description: 'eduID geeft een relatie aan met een hoger onderwijsinstelling of onderzoeksinstituut',
          logo: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png' },
          background: {
            image: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_bg.png' },
            color: '#4779aa',
          },
          text: { color: '#ffffff' },
        },
      ]

      const issuerBranding: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'eduID',
          description: 'eduID represents your affiliation with an institute of higher education or research',
          logo: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png', alt: 'EduID' },
          background: {
            image: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_bg.png' },
            color: '#4779aa',
          },
          text: { color: '#ffffff' },
        },
        {
          locale: 'nl',
          alias: 'eduID',
          description: 'eduID is een relatie met een hoger onderwijs- of onderzoeksinstelling',
          logo: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png', alt: 'EduID' },
          background: {
            image: { uri: 'https://static.dev.eduid.nl/images/eduid_credential_bg.png' },
            color: '#4779aa',
          },
          text: { color: '#ffffff' },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vctBranding, issuerBranding)

      // Should have 2 locales (from VCT, matching issuer by lang prefix)
      expect(result).toHaveLength(2)

      const en = result.find((b) => b.locale === 'en-GB')
      expect(en).toBeDefined()
      expect(en!.logo?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_logo.png')
      expect(en!.background?.image?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_bg.png')
      expect(en!.background?.color).toBe('#4779aa')
      expect(en!.text?.color).toBe('#ffffff')

      const nl = result.find((b) => b.locale === 'nl-NL')
      expect(nl).toBeDefined()
      expect(nl!.logo?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_logo.png')
      expect(nl!.background?.image?.uri).toBe('https://static.dev.eduid.nl/images/eduid_credential_bg.png')
    })

    it('should handle scenario where VCT has logo but no background, issuer has background but no logo', () => {
      // This is a key merge scenario: each source contributes a different field
      const vctBranding: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test Credential',
          logo: { uri: 'https://vct.example.com/logo.png' },
          text: { color: '#ffffff' },
        },
      ]

      const issuerBranding: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'en',
          alias: 'Test Credential',
          background: {
            image: { uri: 'https://issuer.example.com/bg.png' },
            color: '#003366',
          },
        },
      ]

      const result = mergeCredentialLocaleBrandings(vctBranding, issuerBranding)

      expect(result).toHaveLength(1)
      // Logo from VCT
      expect(result[0].logo?.uri).toBe('https://vct.example.com/logo.png')
      // Background from issuer (VCT didn't have it)
      expect(result[0].background?.image?.uri).toBe('https://issuer.example.com/bg.png')
      expect(result[0].background?.color).toBe('#003366')
      // Text from VCT
      expect(result[0].text?.color).toBe('#ffffff')
    })

    it('should fall back to no-locale secondary when no language match exists', () => {
      const primary: Array<IBasicCredentialLocaleBranding> = [
        {
          locale: 'fr',
          alias: 'French Name',
          logo: { uri: 'https://example.com/logo-fr.png' },
        },
      ]
      // Secondary only has a no-locale entry (acts as default)
      const secondary: Array<IBasicCredentialLocaleBranding> = [
        {
          // no locale
          alias: 'Default Name',
          background: { image: { uri: 'https://example.com/bg-default.png' } },
          description: 'Default description',
        },
      ]

      const result = mergeCredentialLocaleBrandings(primary, secondary)

      expect(result).toHaveLength(1)
      expect(result[0].locale).toBe('fr')
      expect(result[0].alias).toBe('French Name')
      expect(result[0].logo?.uri).toBe('https://example.com/logo-fr.png')
      // Filled from no-locale secondary
      expect(result[0].background?.image?.uri).toBe('https://example.com/bg-default.png')
      expect(result[0].description).toBe('Default description')
    })
  })

  describe('selectCredentialLocaleBranding', () => {
    const brandings: Array<IBasicCredentialLocaleBranding> = [
      { locale: 'en-US', alias: 'US English' },
      { locale: 'en-GB', alias: 'UK English' },
      { locale: 'en', alias: 'English' },
      { locale: 'nl-NL', alias: 'Dutch' },
      { locale: 'fr', alias: 'French' },
      { alias: 'No locale' }, // no locale
    ]

    it('should return exact locale match first', async () => {
      const result = await selectCredentialLocaleBranding({ locale: 'en-US', localeBranding: brandings })
      expect(result?.alias).toBe('US English')
    })

    it('should return exact match for bare language code', async () => {
      const result = await selectCredentialLocaleBranding({ locale: 'en', localeBranding: brandings })
      expect(result?.alias).toBe('English')
    })

    it('should fall back to language prefix when no exact match', async () => {
      // "en-AU" has no exact match, but "en-US", "en-GB", and "en" all share the "en" prefix
      const result = await selectCredentialLocaleBranding({ locale: 'en-AU', localeBranding: brandings })
      // Should pick the first one with matching language prefix
      expect(result?.locale?.startsWith('en')).toBe(true)
    })

    it('should fall back to no-locale when no language match exists', async () => {
      // "de" has no match at all — not even a prefix
      const result = await selectCredentialLocaleBranding({ locale: 'de', localeBranding: brandings })
      expect(result?.alias).toBe('No locale')
      expect(result?.locale).toBeUndefined()
    })

    it('should fall back to first available when no locale or no-locale matches', async () => {
      // All entries have locales, no no-locale entry
      const localizedOnly: Array<IBasicCredentialLocaleBranding> = [
        { locale: 'nl', alias: 'Dutch' },
        { locale: 'fr', alias: 'French' },
      ]
      const result = await selectCredentialLocaleBranding({ locale: 'ja', localeBranding: localizedOnly })
      // No "ja" match, no no-locale entry → first available
      expect(result?.alias).toBe('Dutch')
    })

    it('should prefer no-locale entry when no locale preference given', async () => {
      const result = await selectCredentialLocaleBranding({ localeBranding: brandings })
      expect(result?.alias).toBe('No locale')
    })

    it('should return first available when no locale preference and no no-locale entry', async () => {
      const localizedOnly: Array<IBasicCredentialLocaleBranding> = [
        { locale: 'nl', alias: 'Dutch' },
        { locale: 'fr', alias: 'French' },
      ]
      const result = await selectCredentialLocaleBranding({ localeBranding: localizedOnly })
      expect(result?.alias).toBe('Dutch')
    })

    it('should return undefined for empty branding array', async () => {
      const result = await selectCredentialLocaleBranding({ locale: 'en', localeBranding: [] })
      expect(result).toBeUndefined()
    })

    it('should return undefined for undefined branding', async () => {
      const result = await selectCredentialLocaleBranding({ locale: 'en' })
      expect(result).toBeUndefined()
    })

    it('should work with issuer branding types', async () => {
      const issuerBrandings: Array<IBasicIssuerLocaleBranding> = [
        { locale: 'en', alias: 'Issuer EN' },
        { locale: 'nl', alias: 'Issuer NL' },
      ]
      const result = await selectCredentialLocaleBranding({ locale: 'nl', localeBranding: issuerBrandings })
      expect(result?.alias).toBe('Issuer NL')
    })

    it('should match nl-NL to bare nl when no exact match', async () => {
      const result = await selectCredentialLocaleBranding({ locale: 'nl-BE', localeBranding: brandings })
      // nl-BE has no exact match, but nl-NL shares the "nl" prefix
      expect(result?.locale).toBe('nl-NL')
    })

    it('should match bare locale to regional variant', async () => {
      // User asks for "nl" — we have "nl-NL" but also no bare "nl"
      const regionalOnly: Array<IBasicCredentialLocaleBranding> = [
        { locale: 'en-US', alias: 'US English' },
        { locale: 'nl-NL', alias: 'Dutch Netherlands' },
      ]
      const result = await selectCredentialLocaleBranding({ locale: 'nl', localeBranding: regionalOnly })
      expect(result?.alias).toBe('Dutch Netherlands')
    })
  })
})
