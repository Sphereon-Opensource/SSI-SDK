import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint({ name: 'isNonEmptyString', async: false })
export class IsNonEmptyStringConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    return !isEmptyString(value)
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not be an empty string.`
  }
}

export const isEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length === 0
}
