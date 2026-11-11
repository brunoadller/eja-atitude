import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'not found') { super(message, 404); }
}
