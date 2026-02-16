export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export function isDevBypassAllowed(): boolean {
  return process.env.NODE_ENV !== 'production'
}
