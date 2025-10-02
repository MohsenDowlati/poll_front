import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';

export interface LoginCredentials {
  password: string;
  phone: string;
  [key: string]: unknown;
}

export interface SignupPayload extends LoginCredentials {
  name: string;
  organization: string;
}

export const login = (data: LoginCredentials) => {
  return http.post(endpoints.auth.login, data);
};

export const signup = (data: SignupPayload) => {
  return http.post(endpoints.auth.signup, data);
};