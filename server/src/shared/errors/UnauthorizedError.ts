import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'not authenticated') { super(message, 401); }
}
