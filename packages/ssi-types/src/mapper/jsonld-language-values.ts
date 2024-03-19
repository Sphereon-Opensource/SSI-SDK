import { ObjectUtils } from '../utils'

export type LanguageValueClaim = {
  language: string
  value: string | string[] | number | number[]
}

export const isLanguageValueObject = (claim?: unknown): claim is LanguageValueClaim => {
  if (!claim || !ObjectUtils.isObject(claim) || Array.isArray(claim)) {
    return false
  }
  const keys = Object.keys(claim)
  if (keys.length !== 2) {
    return false // Only 'language' and 'value' for now
  } else if (!('language' in claim && !!claim.language)) {
    return false
  } else if (!('value' in claim && !!claim.value)) {
    return false
  }
  return true
}

export const isLanguageValueObjects = (claim?: unknown): claim is LanguageValueClaim[] => {
  if (!claim || !Array.isArray(claim)) {
    return false
  }
  return claim.every((val) => isLanguageValueObject(val))
}

export const toLanguageValueObject = (claim?: unknown): LanguageValueClaim | undefined => {
  return isLanguageValueObject(claim) ? claim : undefined
}

export const toLanguageValueObjects = (claim?: unknown): LanguageValueClaim[] | undefined => {
  if (isLanguageValueObject(claim)) {
    return ObjectUtils.asArray(toLanguageValueObject(claim) as LanguageValueClaim)
  } else if (isLanguageValueObjects(claim)) {
    return claim
  }
  return undefined // no empty array on purpose, as this really would not be a language value object
}

export const mapLanguageValue = (
  claim?: unknown,
  opts?: {
    language?: string
    fallbackToFirstObject?: boolean
  },
): any => {
  const langValues = toLanguageValueObjects(claim)
  if (Array.isArray(langValues)) {
    if (langValues.length === 0) {
      // should not happen, but let's return original claim to be sure
      return claim
    }
    const filteredLangValues = langValues.filter((val) => (opts?.language ? val.language.toLowerCase().includes(opts.language.toLowerCase()) : true))

    let langValue: LanguageValueClaim
    if (filteredLangValues.length > 0) {
      langValue = filteredLangValues[0]
    } else {
      if (opts?.fallbackToFirstObject === false) {
        // No match and we also do not fallback to the first value, so return the original claim
        return claim
      }
      // Fallback to the first value
      langValue = langValues[0]
    }
    return langValue.value
  }

  return claim
}

export const mapLanguageValues = <T extends object>(
  claimsOrCredential: T,
  opts?: {
    language?: string
    fallbackToFirstObject?: boolean
    noDeepClone?: boolean
  },
): T => {
  const result = opts?.noDeepClone ? claimsOrCredential : JSON.parse(JSON.stringify(claimsOrCredential))
  Object.keys(claimsOrCredential).forEach((key) => {
    result[key] = mapLanguageValue(result[key], opts)
    if (ObjectUtils.isObject(result[key]) || Array.isArray(result[key])) {
      result[key] = mapLanguageValues(result[key], { ...opts, noDeepClone: true })
    }
  })
  return result
}
