import { ValidationError } from 'class-validator'
import { ValidationConstraint } from '../types'

export const getConstraint = (validation: ValidationError): ValidationConstraint | undefined => {
  if (validation.children && validation.children.length > 0) {
    return getConstraint(validation.children[0])
  } else {
    return validation.constraints
  }
}
