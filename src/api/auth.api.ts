import api from "./axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export const loginUser = (data: LoginPayload) =>
  api.post<AuthResponse>("/auth/login", data);

export const registerUser = (data: RegisterPayload) =>
  api.post<AuthResponse>("/auth/register", data);

export const getProfile = () =>
  api.get("/auth/me");