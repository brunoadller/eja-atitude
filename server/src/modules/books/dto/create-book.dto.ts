export interface CreateBookDto {
  title: string;
  subject: string;
  moduleNumber: 1 | 2;
  description?: string;
  fileUrl: string;
}
