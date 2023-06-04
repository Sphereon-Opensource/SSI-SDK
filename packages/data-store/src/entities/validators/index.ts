import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint({ name: 'isNonEmptyString', async: false })
export class IsNonEmptyStringConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    if (!value) {
      return true
    }

    return value.trim() !== ''
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not be an empty string.`
  }
}
