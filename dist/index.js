"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AdminAPI: () => AdminAPI,
  OAuth2: () => OAuth2,
  ThalamusClient: () => ThalamusClient,
  TokenManager: () => TokenManager,
  default: () => ThalamusClient
});
module.exports = __toCommonJS(index_exports);

// src/auth/OAuth2.ts
var OAuth2 = class {
  constructor(config) {
    this.config = config;
  }
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
  getAuthorizationUrl(options) {
    const {
      scope = this.config.defaultScopes || ["openid", "profile", "email"],
      state = this.generateState(),
      responseType = "code"
    } = options || {};
    const params = new URLSearchParams({
      response_type: responseType,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: Array.isArray(scope) ? scope.join(" ") : scope,
      state
    });
    return `${this.config.baseUrl}/oauth/authorize?${params.toString()}`;
  }
  /**
   * Exchange authorization code for access token
   *
   * @example
   * ```ts
   * const tokens = await thalamus.auth.exchangeCode('authorization_code_here')
   * console.log(tokens.access_token)
   * ```
   */
  async exchangeCode(codeOrOptions) {
    const code = typeof codeOrOptions === "string" ? codeOrOptions : codeOrOptions.code;
    const body = {
      grant_type: "authorization_code",
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri
    };
    return this.requestToken(body);
  }
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
  async getClientCredentialsToken(options) {
    const { scope = this.config.defaultScopes || [] } = options || {};
    const body = {
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    };
    if (scope.length > 0) {
      body.scope = Array.isArray(scope) ? scope.join(" ") : scope;
    }
    return this.requestToken(body);
  }
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
  async refreshToken(options) {
    const body = {
      grant_type: "refresh_token",
      refresh_token: options.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    };
    return this.requestToken(body);
  }
  /**
   * Revoke a token (access or refresh token)
   *
   * @example
   * ```ts
   * await thalamus.auth.revokeToken('at_...')
   * ```
   */
  async revokeToken(token, tokenTypeHint) {
    const body = {
      token
    };
    if (tokenTypeHint) {
      body.token_type_hint = tokenTypeHint;
    }
    const response = await fetch(`${this.config.baseUrl}/oauth/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw await this.handleError(response);
    }
  }
  /**
   * Generate random state for CSRF protection
   */
  generateState() {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      const cryptoModule = require("crypto");
      cryptoModule.randomFillSync(array);
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Make token request to /oauth/token
   */
  async requestToken(body) {
    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw await this.handleError(response);
    }
    return response.json();
  }
  /**
   * Handle API errors
   */
  async handleError(response) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const error = new Error(
      errorData.error_description || errorData.message || `HTTP ${response.status}`
    );
    error.statusCode = response.status;
    error.error = errorData.error;
    error.error_description = errorData.error_description;
    return error;
  }
};

// src/tokens/TokenManager.ts
var TokenManager = class {
  constructor(config) {
    this.config = config;
  }
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
  async introspect(token) {
    const response = await fetch(`${this.config.baseUrl}/oauth/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    if (!response.ok) {
      throw await this.handleError(response);
    }
    return response.json();
  }
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
  async getUserInfo(accessToken) {
    const response = await fetch(`${this.config.baseUrl}/oauth/userinfo`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw await this.handleError(response);
    }
    return response.json();
  }
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
  async validate(token) {
    try {
      const result = await this.introspect(token);
      return result.active === true;
    } catch {
      return false;
    }
  }
  /**
   * Handle API errors
   */
  async handleError(response) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const error = new Error(
      errorData.error_description || errorData.message || `HTTP ${response.status}`
    );
    error.statusCode = response.status;
    error.error = errorData.error;
    error.error_description = errorData.error_description;
    return error;
  }
};

// src/admin/AdminAPI.ts
var AdminAPI = class {
  constructor(config) {
    this.config = config;
  }
  get baseUrl() {
    return this.config.baseUrl;
  }
  // ── Users ────────────────────────────────────────────────────────────────
  /** List all users */
  async listUsers() {
    const res = await this.request(`${this.baseUrl}/api/users`);
    const json = await res.json();
    return json.data ?? json;
  }
  /** Get a single user */
  async getUser(id) {
    const res = await this.request(`${this.baseUrl}/api/users/${id}`);
    const json = await res.json();
    return json.data ?? json;
  }
  // ── Organizations ─────────────────────────────────────────────────────────
  /** Get an organization */
  async getOrganization(id) {
    const res = await this.request(`${this.baseUrl}/api/organizations/${id}`);
    const json = await res.json();
    return json.data ?? json;
  }
  /** List all organizations */
  async listOrganizations() {
    const res = await this.request(`${this.baseUrl}/api/organizations`);
    const json = await res.json();
    return json.data ?? json;
  }
  // ── Domain Roles ──────────────────────────────────────────────────────────
  /** List domain roles (optionally filtered) */
  async listDomainRoles(filters) {
    const params = new URLSearchParams();
    if (filters?.user_id) params.set("user_id", filters.user_id);
    if (filters?.organization_id) params.set("organization_id", filters.organization_id);
    if (filters?.domain) params.set("domain", filters.domain);
    const qs = params.toString();
    const url = `${this.baseUrl}/api/domains/roles${qs ? `?${qs}` : ""}`;
    const res = await this.request(url);
    const json = await res.json();
    return json.data ?? json;
  }
  /** Grant a domain role to a user */
  async grantDomainRole(params) {
    const res = await this.request(`${this.baseUrl}/api/domains/roles/grant`, {
      method: "POST",
      body: JSON.stringify(params)
    });
    return res.json();
  }
  /** Revoke a domain role from a user */
  async revokeDomainRole(params) {
    const res = await this.request(`${this.baseUrl}/api/domains/roles/revoke`, {
      method: "DELETE",
      body: JSON.stringify(params)
    });
    return res.json();
  }
  // ── Roles (RBAC) ──────────────────────────────────────────────────────────
  /** List all roles */
  async listRoles() {
    const res = await this.request(`${this.baseUrl}/api/roles`);
    const json = await res.json();
    return json.data ?? json;
  }
  /** Create a role */
  async createRole(params) {
    const res = await this.request(`${this.baseUrl}/api/roles`, {
      method: "POST",
      body: JSON.stringify(params)
    });
    const json = await res.json();
    return json.data ?? json;
  }
  /** Delete a role */
  async deleteRole(id) {
    await this.request(`${this.baseUrl}/api/roles/${id}`, { method: "DELETE" });
  }
  // ── User Roles ────────────────────────────────────────────────────────────
  /** Get user's effective scopes */
  async getEffectiveScopes(userId) {
    const res = await this.request(`${this.baseUrl}/api/users/${userId}/effective-scopes`);
    const json = await res.json();
    return json.data ?? json;
  }
  // ── Internal ──────────────────────────────────────────────────────────────
  getAccessToken() {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      const saved = globalThis.localStorage.getItem("auth");
      if (saved) {
        try {
          return JSON.parse(saved).accessToken;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
  async request(url, options = {}) {
    const token = this.getAccessToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...token ? { Authorization: `Bearer ${token}` } : {},
        ...options.headers
      }
    });
    if (!res.ok) {
      throw await this.toError(res);
    }
    return res;
  }
  async toError(response) {
    let body = {};
    try {
      body = await response.json();
    } catch {
    }
    const error = new Error(
      body.error_description || body.error || `HTTP ${response.status}`
    );
    error.statusCode = response.status;
    error.error = body.error;
    error.error_description = body.error_description;
    return error;
  }
};

// src/ThalamusClient.ts
var ThalamusClient = class {
  /**
   * Create a new Thalamus client
   *
   * @param config - Client configuration
   */
  constructor(config) {
    if (!config.clientId) {
      throw new Error("clientId is required");
    }
    if (!config.redirectUri) {
      throw new Error("redirectUri is required");
    }
    if (!config.baseUrl) {
      throw new Error("baseUrl is required");
    }
    config.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.config = config;
    this.auth = new OAuth2(config);
    this.tokens = new TokenManager(config);
    this.admin = new AdminAPI(config);
  }
  /**
   * Get the current configuration
   */
  getConfig() {
    return Object.freeze({ ...this.config });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminAPI,
  OAuth2,
  ThalamusClient,
  TokenManager
});
