import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message = 'access denied') { super(message, 403); }
}
