
import axios from "axios";
import { clearAuth } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});


// --------------------------------------------------
// Add JWT token to requests
// --------------------------------------------------
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// --------------------------------------------------
// Global response interceptor
// Handles expired / invalid authentication sessions
// --------------------------------------------------
let isRedirectingToLogin = false;

api.interceptors.response.use(

  // Successful response
  (response) => {
    return response;
  },

  // Error response
  (error) => {

    // ------------------------------------------------
    // Network error
    // No response means the server did not respond.
    // Do NOT clear authentication data.
    // ------------------------------------------------
    if (!error.response) {
      return Promise.reject(error);
    }


    const status = error.response.status;

    // ------------------------------------------------
    // Only handle HTTP 401
    // 403 and other errors must continue normally.
    // ------------------------------------------------
    if (status !== 401) {
      return Promise.reject(error);
    }


    // ------------------------------------------------
    // Do NOT treat failed login as session expiry.
    // A 401 from /auth/login means invalid credentials.
    // ------------------------------------------------
    const requestUrl = error.config?.url || "";

    if (requestUrl.includes("/auth/login")) {
      return Promise.reject(error);
    }


    // ------------------------------------------------
    // Prevent multiple simultaneous 401 responses
    // from causing multiple redirects.
    // ------------------------------------------------
    if (!isRedirectingToLogin) {

      isRedirectingToLogin = true;


      // ----------------------------------------------
      // Save the page the user was trying to access.
      // ----------------------------------------------
      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;


      // ----------------------------------------------
      // Clear expired authentication information.
      // ----------------------------------------------
      clearAuth();


      // ----------------------------------------------
      // Redirect to Login and pass the original page.
      // ----------------------------------------------
      if (currentPath !== "/login") {

        window.location.href =
          `/login?sessionExpired=true&from=${encodeURIComponent(currentPath)}`;

      } else {

        window.location.href = "/login";

      }
    }


    return Promise.reject(error);
  }
);


export default api;

