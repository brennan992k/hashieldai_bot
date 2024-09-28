import { BadRequestException, ValidationError } from '@nestjs/common';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { ValidatorOptions, validate } from 'class-validator';

const _getMessageFromError = (
  error: ValidationError,
): string | null | undefined => {
  if (error.children && error.children.length > 0) {
    return _getMessageFromError(error.children[0]);
  }

  return Object.values(error.constraints)[0];
};

export async function validateBody<T extends object>(
  body: T,
  body_class?: ClassConstructor<T>,
  validatorOptions?: ValidatorOptions,
): Promise<T> {
  const transformed_body: T = body_class
    ? plainToClass(body_class, body)
    : body;

  const errors = await validate(transformed_body as object, validatorOptions);

  if (errors.length > 0) {
    const error = errors[0];
    throw new BadRequestException(_getMessageFromError(error) ?? '');
  }

  return transformed_body;
}
