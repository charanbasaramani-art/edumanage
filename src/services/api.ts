import axios from "axios";

// Since frontend and backend run on the exact same port (3000) under our unified Express app,
// we can use standard relative paths by default.
// For external hosting deployments like Netlify, we resolve from localStorage overrides or VITE_API_URL env.
// Helper to determine the best API base URL automatically
function getApiBaseUrl(): string {
  // 1. Check if there's a manual override in localStorage
  const override = localStorage.getItem("override_api_url");
  if (override) return override;

  // 2. Check if there's a build-time environment variable
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) return envUrl;

  // 3. Auto-detect environment based on current hostname
  const hostname = window.location.hostname;
  const isCoLocated = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".run.app");

  if (isCoLocated) {
    // Local development or co-located Cloud Run full-stack deployment
    return "";
  } else {
    // External host like Netlify/Vercel -> target the live Cloud Run backend URL automatically
    return "https://ais-pre-qy2vqkrtdehdnxdbr2zucd-944828103572.asia-southeast1.run.app";
  }
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

// Axios Request Interceptor: Automatically injects JWT Bearer token and updates baseURL dynamically
API.interceptors.request.use(
  (config) => {
    // Dynamically re-evaluate base URL in case of runtime configuration changes
    config.baseURL = getApiBaseUrl();
    
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios Response Interceptor: Listens for authentication expiries (401 errors)
// to automatically clean the local storage and force redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // Clear credentials only if we are not already on the login page
      if (currentPath !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
