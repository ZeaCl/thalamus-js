/**
 * ZEA Thalamus SDK Types
 *
 * TypeScript type definitions for the Thalamus OAuth2 SDK
 */
interface ThalamusConfig {
    /** OAuth2 Client ID */
    clientId: string;
    /** OAuth2 Client Secret (for confidential clients) */
    clientSecret?: string;
    /** Redirect URI for authorization callback */
    redirectUri: string;
    /** Thalamus base URL (e.g., https://auth.example.com) */
    baseUrl: string;
    /** Default scopes to request */
    defaultScopes?: string[];
}
interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
    scope?: string;
}
interface IntrospectionResponse {
    active: boolean;
    scope?: string;
    client_id?: string;
    user_id?: string;
    username?: string;
    email?: string;
    organization_id?: string;
    tenant_id?: string;
    token_type?: string;
    exp?: number;
    iat?: number;
    sub?: string;
    agent_type?: 'autonomous' | 'supervised' | 'ephemeral';
    delegated_by?: string;
    delegation_chain?: string[];
    delegation_depth?: number;
    task_id?: string;
    max_operations?: number;
    operations_remaining?: number;
    expires_on_completion?: boolean;
    intent_description?: string;
}
interface UserInfo {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    organization_id?: string;
}
interface AuthorizationUrlOptions {
    scope?: string[];
    state?: string;
    responseType?: 'code';
    codeChallenge?: string;
    codeChallengeMethod?: 'S256';
}
interface TokenExchangeOptions {
    code: string;
    codeVerifier?: string;
}
interface ClientCredentialsOptions {
    scope?: string[];
}
interface RefreshTokenOptions {
    refreshToken: string;
}
interface ThalamusError extends Error {
    statusCode?: number;
    error?: string;
    error_description?: string;
}
interface MCPServerConfig {
    name: string;
    type: 'cli' | 'url' | 'sse';
    /** Executable command (for type: cli) */
    command?: string;
    /** Server URL (for type: url, sse) */
    url?: string;
    /** Glob patterns to filter which tools are exposed. ["*"] = all, ["venture_*"] = filtered */
    tools_filter?: string[];
    enabled: boolean;
}
interface AgentConfig {
    system_prompt?: string;
    skills?: string[];
    icon?: string;
    model?: string;
    mcp_servers?: MCPServerConfig[];
    custom_skills?: CustomSkill[];
}
interface CustomSkill {
    name: string;
    description: string;
    body: string;
}

/**
 * OAuth2 Authentication Module
 *
 * Handles OAuth2 authorization code flow, client credentials, and token refresh
 */

declare class OAuth2 {
    private config;
    constructor(config: ThalamusConfig);
    /**
     * Generate OAuth2 authorization URL for user login
     *
     * @example
     * ```ts
     * const authUrl = thalamus.auth.getAuthorizationUrl({
     *   scope: ['openid', 'profile', 'email'],
     *   state: 'random-state-string'
     * })
     * // Redirect user to authUrl
     * ```
     */
    getAuthorizationUrl(options?: AuthorizationUrlOptions): string;
    /**
     * Exchange authorization code for access token
     *
     * @example
     * ```ts
     * const tokens = await thalamus.auth.exchangeCode('authorization_code_here')
     * console.log(tokens.access_token)
     * ```
     */
    exchangeCode(codeOrOptions: string | TokenExchangeOptions): Promise<TokenResponse>;
    /**
     * Get access token using client credentials (M2M)
     *
     * @example
     * ```ts
     * const tokens = await thalamus.auth.getClientCredentialsToken({
     *   scope: ['api:read', 'api:write']
     * })
     * ```
     */
    getClientCredentialsToken(options?: ClientCredentialsOptions): Promise<TokenResponse>;
    /**
     * Refresh access token using refresh token
     *
     * @example
     * ```ts
     * const newTokens = await thalamus.auth.refreshToken({
     *   refreshToken: 'rt_...'
     * })
     * ```
     */
    refreshToken(options: RefreshTokenOptions): Promise<TokenResponse>;
    /**
     * Revoke a token (access or refresh token)
     *
     * @example
     * ```ts
     * await thalamus.auth.revokeToken('at_...')
     * ```
     */
    revokeToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<void>;
    /**
     * Generate random state for CSRF protection
     */
    private generateState;
    /**
     * Make token request to /oauth/token
     */
    private requestToken;
    /**
     * Handle API errors
     */
    private handleError;
}

/**
 * Token Management Module
 *
 * Handles token introspection and validation
 */

declare class TokenManager {
    private config;
    constructor(config: ThalamusConfig);
    /**
     * Introspect a token to check if it's valid and get metadata
     *
     * @example
     * ```ts
     * const tokenInfo = await thalamus.tokens.introspect('at_...')
     * if (tokenInfo.active) {
     *   console.log(tokenInfo.user_id)
     *   console.log(tokenInfo.scope)
     * }
     * ```
     */
    introspect(token: string): Promise<IntrospectionResponse>;
    /**
     * Get user information from OpenID Connect userinfo endpoint
     *
     * @example
     * ```ts
     * const user = await thalamus.tokens.getUserInfo('at_...')
     * console.log(user.email)
     * console.log(user.name)
     * ```
     */
    getUserInfo(accessToken: string): Promise<UserInfo>;
    /**
     * Validate token and return true if active, false otherwise
     *
     * @example
     * ```ts
     * const isValid = await thalamus.tokens.validate('at_...')
     * if (isValid) {
     *   // Token is valid
     * }
     * ```
     */
    validate(token: string): Promise<boolean>;
    /**
     * Handle API errors
     */
    private handleError;
}

/**
 * Admin API Module
 *
 * User, organization, role, and domain management endpoints.
 * Requires JWT Bearer token authentication.
 */

interface User {
    id: string;
    name: string;
    email: string;
    status: string;
    organization_id?: string;
    is_agent: boolean;
    agent_config?: AgentConfig;
}
interface AdminOrganization {
    id: string;
    name: string;
    domains?: string[];
}
interface AdminRole {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    scopes: string[];
}
interface DomainRole {
    id: string;
    user_id: string;
    organization_id: string;
    domain: string;
    role: string;
    scopes: string[];
}
interface EffectiveScopes {
    user_id: string;
    scopes: string[];
}
declare class AdminAPI {
    private config;
    constructor(config: ThalamusConfig);
    private get baseUrl();
    /** List all users */
    listUsers(): Promise<User[]>;
    /** List all agents (users with is_agent === true) */
    listAgents(): Promise<User[]>;
    /** Get a single user */
    getUser(id: string): Promise<User>;
    /** Add a member to an organization */
    addOrgMember(orgId: string, userId: string): Promise<{
        message: string;
    }>;
    /** Update a user (only name and agent_config are writable) */
    updateUser(id: string, data: Partial<Pick<User, 'name' | 'agent_config'>>): Promise<User>;
    /** Create a user */
    createUser(data: {
        email: string;
        password: string;
        name?: string;
        is_agent?: boolean;
        agent_config?: AgentConfig;
    }): Promise<User>;
    /** Get an organization */
    getOrganization(id: string): Promise<AdminOrganization>;
    /** List all organizations */
    listOrganizations(): Promise<AdminOrganization[]>;
    /** List domain roles (optionally filtered) */
    listDomainRoles(filters?: {
        user_id?: string;
        organization_id?: string;
        domain?: string;
    }): Promise<DomainRole[]>;
    /** Grant a domain role to a user */
    grantDomainRole(params: {
        user_id: string;
        organization_id: string;
        domain: string;
        role: string;
        scopes?: string[];
        entity_id?: string;
    }): Promise<{
        message: string;
    }>;
    /** Revoke a domain role from a user */
    revokeDomainRole(params: {
        user_id: string;
        organization_id: string;
        domain: string;
        role: string;
    }): Promise<{
        message: string;
    }>;
    /** List all roles */
    listRoles(): Promise<AdminRole[]>;
    /** Create a role */
    createRole(params: {
        organization_id: string;
        name: string;
        description?: string;
        scopes: string[];
    }): Promise<AdminRole>;
    /** Delete a role */
    deleteRole(id: string): Promise<void>;
    /** Get user's effective scopes */
    getEffectiveScopes(userId: string): Promise<EffectiveScopes>;
    private getAccessToken;
    private request;
    private toError;
}

/**
 * ZEA Thalamus OAuth2 Client
 *
 * Official JavaScript/TypeScript SDK for Thalamus OAuth2 Server
 *
 * @example
 * ```ts
 * import ThalamusClient from '@zea/thalamus-js'
 *
 * const thalamus = new ThalamusClient({
 *   clientId: process.env.THALAMUS_CLIENT_ID,
 *   clientSecret: process.env.THALAMUS_CLIENT_SECRET,
 *   redirectUri: 'https://yourapp.com/auth/callback',
 *   baseUrl: 'https://auth.example.com'
 * })
 *
 * // Get authorization URL
 * const authUrl = thalamus.auth.getAuthorizationUrl()
 *
 * // Exchange code for tokens
 * const tokens = await thalamus.auth.exchangeCode(code)
 *
 * // Introspect token
 * const tokenInfo = await thalamus.tokens.introspect(accessToken)
 * ```
 */

declare class ThalamusClient {
    /** OAuth2 authentication methods */
    readonly auth: OAuth2;
    /** Token management and introspection */
    readonly tokens: TokenManager;
    /** Admin API — users, orgs, roles, domain management */
    readonly admin: AdminAPI;
    private readonly config;
    /**
     * Create a new Thalamus client
     *
     * @param config - Client configuration
     */
    constructor(config: ThalamusConfig);
    /**
     * Get the current configuration
     */
    getConfig(): Readonly<ThalamusConfig>;
}

export { AdminAPI, type AdminOrganization, type AdminRole, type User as AdminUser, type AgentConfig, type AuthorizationUrlOptions, type ClientCredentialsOptions, type CustomSkill, type DomainRole, type EffectiveScopes, type IntrospectionResponse, type MCPServerConfig, OAuth2, type RefreshTokenOptions, ThalamusClient, type ThalamusConfig, type ThalamusError, type TokenExchangeOptions, TokenManager, type TokenResponse, type User, type UserInfo, ThalamusClient as default };
