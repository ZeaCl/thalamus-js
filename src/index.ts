/**
 * @zea/thalamus-js
 *
 * Official JavaScript/TypeScript SDK for ZEA Thalamus OAuth2 Server
 *
 * @packageDocumentation
 */

export { ThalamusClient } from './ThalamusClient'
export { OAuth2 } from './auth/OAuth2'
export { TokenManager } from './tokens/TokenManager'
export { AdminAPI } from './admin/AdminAPI'

export type {
  ThalamusConfig,
  TokenResponse,
  IntrospectionResponse,
  UserInfo,
  AuthorizationUrlOptions,
  TokenExchangeOptions,
  ClientCredentialsOptions,
  RefreshTokenOptions,
  ThalamusError,
} from './types'

export type {
  AdminUser,
  AdminOrganization,
  AdminRole,
  DomainRole,
  EffectiveScopes,
} from './admin/AdminAPI'

// Default export
export { ThalamusClient as default } from './ThalamusClient'
