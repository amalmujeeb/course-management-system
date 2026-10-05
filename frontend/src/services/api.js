
import axios from "axios";
import { clearAuth } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});


// ==================================================
// Add JWT token to every request
// ==================================================
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


// ==================================================
// Global Axios Response Interceptor
// ==================================================

let isRedirectingToLogin = false;

api.interceptors.response.use(

  // ------------------------------------------------
  // Successful response
  // ------------------------------------------------
  (response) => {
    return response;
  },


  // ------------------------------------------------
  // Error response
  // ------------------------------------------------
  (error) => {

    // ==================================================
    // 1. Network error
    // ==================================================
    // If there is no response from the server,
    // this is a network/server connection problem.
    //
    // DO NOT clear authentication information.
    // ==================================================

    if (!error.response) {
      return Promise.reject(error);
    }


    const status = error.response.status;


    // ==================================================
    // 2. Only HTTP 401 is handled here
    // ==================================================
    //
    // 403 and other errors are NOT treated as
    // session expiry.
    // ==================================================

    if (status !== 401) {
      return Promise.reject(error);
    }


    // ==================================================
    // 3. Exclude the Login request
    // ==================================================
    //
    // A 401 from /auth/login means incorrect username
    // or password. It must NOT trigger logout.
    // ==================================================

    const requestUrl = error.config?.url || "";

    if (requestUrl.includes("/auth/login")) {
      return Promise.reject(error);
    }


    // ==================================================
    // 4. Prevent duplicate redirects
    // ==================================================

    if (!isRedirectingToLogin) {

      isRedirectingToLogin = true;


      // ==================================================
      // 5. Preserve the current page
      // ==================================================

      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;


      // ==================================================
      // 6. Clear expired authentication information
      // ==================================================

      clearAuth();


      // ==================================================
      // 7. Redirect to Login
      // ==================================================

      if (currentPath !== "/login") {

        const loginUrl =
          `/login?sessionExpired=true&from=${encodeURIComponent(
            currentPath
          )}`;

        window.location.href = loginUrl;

      } else {

        window.location.href = "/login";

      }
    }


    return Promise.reject(error);
  }
);


export default api;

