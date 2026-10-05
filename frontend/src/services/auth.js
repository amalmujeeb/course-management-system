
const TOKEN_KEY = "token";
const USER_KEY = "user";


// ==================================================
// Save token + user after successful login
// ==================================================
export function saveAuth(token, user) {

  localStorage.setItem(TOKEN_KEY, token);

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}


// ==================================================
// Read token
// ==================================================
export function getToken() {

  return localStorage.getItem(TOKEN_KEY);
}


// ==================================================
// Read logged-in user
// ==================================================
export function getUser() {

  const userJson = localStorage.getItem(USER_KEY);

  if (!userJson) {
    return null;
  }

  try {

    return JSON.parse(userJson);

  } catch (error) {

    console.error(
      "Could not read user from localStorage:",
      error.message
    );

    return null;
  }
}


// ==================================================
// Logout
// ==================================================
export function clearAuth() {

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);
}


// ==================================================
// Check whether user is logged in
// ==================================================
export function isLoggedIn() {

  return Boolean(
    getToken() &&
    getUser()
  );
}


// ==================================================
// Get user role
// ==================================================
export function getUserRole() {

  const user = getUser();

  return user ? user.role : null;
}


// ==================================================
// Check admin
// ==================================================
export function isAdmin() {

  return getUserRole() === "admin";
}


// ==================================================
// Check student
// ==================================================
export function isStudent() {

  return getUserRole() === "student";
}

