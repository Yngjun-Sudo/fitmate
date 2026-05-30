// Auth-related type definitions

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: number;
  gender?: string;
  goal?: string;
  activityLevel?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: number | null;
  gender: string | null;
  goal: string | null;
  activityLevel: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthContext {
  user: JwtPayload;
}
