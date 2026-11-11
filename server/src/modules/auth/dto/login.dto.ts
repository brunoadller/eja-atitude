export interface LoginDto {
  type: 'admin' | 'student';
  username: string; // admin username OR student enrollment number
  password: string;
}
