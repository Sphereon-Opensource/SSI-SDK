import i18n, { Scope, TranslateOptions } from 'i18n-js'
import memoize from 'lodash.memoize'
import { SupportedLanguage } from '../types'

class Localization {
  private static translationGetters: { [locale: string]: () => object } = {
    [SupportedLanguage.ENGLISH]: () => require('./translations/en.json'),
    [SupportedLanguage.DUTCH]: () => require('./translations/nl.json'),
  }

  public static translate: any = memoize(
    (key: Scope, config?: TranslateOptions) => {
      // If no LocaleProvider is used we need to load the default locale as the translations will be empty
      if (Object.keys(i18n.translations).length === 0) {
        i18n.translations = {
          [SupportedLanguage.ENGLISH]: Localization.translationGetters[SupportedLanguage.ENGLISH](),
        }
        i18n.locale = SupportedLanguage.ENGLISH
      } else {
        i18n.translations = {
          [i18n.locale]: {
            ...i18n.translations[i18n.locale],
            ...Localization.translationGetters[this.findSupportedLanguage(i18n.locale) || SupportedLanguage.ENGLISH](),
          },
        }
      }

      return i18n.t(key, config)
    },
    (key: Scope, config?: TranslateOptions) => (config ? key + JSON.stringify(config) : key),
  )

  private static findSupportedLanguage = (locale: string): string | undefined => {
    for (const language of Object.values(SupportedLanguage)) {
      if (language === locale) {
        return language
      }
    }

    return undefined
  }

  public static getLocale = (): string => {
    return i18n.locale || SupportedLanguage.ENGLISH
  }
}

export const translate = Localization.translate
export default Localization
