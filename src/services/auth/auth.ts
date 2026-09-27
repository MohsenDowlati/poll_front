import http from '@/services/httpsService';
import endpoints from '@/services/endpoints';
import type { AxiosResponse } from 'axios';
import { clearAuthTokens, storeAuthTokens } from '@/utils/authToken';

export interface LoginCredentials {
  password: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface SignupPayload extends LoginCredentials {
  name: string;
  organization: string;
}

export const login = (data: LoginCredentials) => {
  return http.post(endpoints.auth.login, data).then((response) => {
    storeAuthTokens(response.data?.accessToken, response.data?.refreshToken);
    return response;
  });
};

export const signup = (data: SignupPayload) => {
  return http.post(endpoints.auth.signup, data).then((response) => {
    storeAuthTokens(response.data?.accessToken, response.data?.refreshToken);
    return response;
  });
};

export interface Profile {
  name: string;
  email: string;
  admin: string;
  is_verified: boolean;
}

let profileRequest: Promise<AxiosResponse<Profile>> | null = null;

export const fetchProfile = () => {
  profileRequest ??= http.get<Profile>('/profile').finally(() => {
    profileRequest = null;
  });
  return profileRequest;
};
export const logout = () => http.post(endpoints.auth.logout).finally(clearAuthTokens);
