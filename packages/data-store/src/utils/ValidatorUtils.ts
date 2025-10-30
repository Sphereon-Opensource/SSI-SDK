import { type ValidationConstraint } from '@sphereon/ssi-sdk.data-store-types'
import { ValidationError } from 'class-validator'

export const getConstraint = (validation: ValidationError): ValidationConstraint | undefined => {
  if (validation.children && validation.children.length > 0) {
    return getConstraint(validation.children[0])
  } else {
    return validation.constraints
  }
}
