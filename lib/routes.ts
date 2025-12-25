export const ROUTES = {
  HOME: '/',
  MINUTES_LIST: '/protected/minutes',
  MINUTES_DETAIL: (id: string) => `/protected/minutes/${id}`,
  LOGIN: '/auth/login',
  SIGNUP: '/auth/sign-up',
  SIGNUP_SUCCESS: '/auth/sign-up-success',
  FORGOT_PASSWORD: '/auth/forgot-password',
} as const;
