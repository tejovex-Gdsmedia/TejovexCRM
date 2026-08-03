export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role | string;
  phone?: string;
  createdAt?: string;
}