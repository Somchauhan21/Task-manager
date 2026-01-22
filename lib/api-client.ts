import type { 
  ApiResponse, 
  PaginatedResponse, 
  AuthTokens, 
  UserPublic, 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO,
  RegisterDTO,
  LoginDTO
} from "./types";

// Token storage keys
const ACCESS_TOKEN_KEY = "task_app_access_token";
const REFRESH_TOKEN_KEY = "task_app_refresh_token";

// Get stored tokens
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Store tokens
export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

// Clear tokens
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Base fetch with auth
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token
  if (response.status === 401 && accessToken) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry with new token
      (headers as Record<string, string>)["Authorization"] = `Bearer ${getAccessToken()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed, clear tokens and redirect to login
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// Refresh tokens
async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data: ApiResponse<{ tokens: AuthTokens }> = await response.json();
    if (data.success && data.data?.tokens) {
      setTokens(data.data.tokens);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Auth API
export const authApi = {
  async register(data: RegisterDTO): Promise<ApiResponse<{ user: UserPublic; tokens: AuthTokens }>> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result: ApiResponse<{ user: UserPublic; tokens: AuthTokens }> = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Registration failed");
    }
    
    if (result.success && result.data?.tokens) {
      setTokens(result.data.tokens);
    }
    
    return result;
  },

  async login(data: LoginDTO): Promise<ApiResponse<{ user: UserPublic; tokens: AuthTokens }>> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result: ApiResponse<{ user: UserPublic; tokens: AuthTokens }> = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Login failed");
    }
    
    if (result.success && result.data?.tokens) {
      setTokens(result.data.tokens);
    }
    
    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      });
    } catch {
      // Ignore errors during logout
    }
    clearTokens();
  },

  async getMe(): Promise<ApiResponse<{ user: UserPublic }>> {
    return fetchWithAuth("/api/auth/me");
  },
};

// Tasks API
export interface TasksQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const tasksApi = {
  async getAll(params: TasksQueryParams = {}): Promise<PaginatedResponse<Task>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    return fetchWithAuth(`/api/tasks${query ? `?${query}` : ""}`);
  },

  async getOne(id: string): Promise<ApiResponse<{ task: Task }>> {
    return fetchWithAuth(`/api/tasks/${id}`);
  },

  async create(data: CreateTaskDTO): Promise<ApiResponse<{ task: Task }>> {
    return fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateTaskDTO): Promise<ApiResponse<{ task: Task }>> {
    return fetchWithAuth(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return fetchWithAuth(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async toggle(id: string): Promise<ApiResponse<{ task: Task }>> {
    return fetchWithAuth(`/api/tasks/${id}/toggle`, {
      method: "PATCH",
    });
  },
};
