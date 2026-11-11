import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message = 'invalid data') { super(message, 400); }
}
