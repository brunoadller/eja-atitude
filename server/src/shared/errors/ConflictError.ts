import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message = 'data conflict') { super(message, 409); }
}
