export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}
