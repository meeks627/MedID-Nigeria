/**
 * Safe fetch & JSON parsing utilities for MedID frontend portals.
 * Protects against unexpected HTML responses (e.g. 500, 502, 504 from cloud edges or proxies)
 * from crashing React components with SyntaxError: Unexpected token 'A'.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    
    // If response is JSON
    if (contentType.includes("application/json")) {
      try {
        const data = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data,
          error: res.ok ? undefined : data?.error || `Request failed with status ${res.status}`,
        };
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null as any,
          error: "Failed to parse JSON response from server.",
        };
      }
    }

    // Response is non-JSON (e.g. HTML 500 error page from reverse proxy)
    const text = await res.text();
    return {
      ok: false,
      status: res.status,
      data: null as any,
      error: res.ok
        ? "Expected JSON response but received text/html."
        : `Server error (${res.status}): ${text.slice(0, 100).trim() || "Unknown error"}`,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null as any,
      error: netErr.message || "Failed to connect to the MedID server.",
    };
  }
}
