
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { saveAuth } from "../services/auth";
import Navbar from "../components/Navbar";


function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  // ==================================================
  // Check whether this Login page was reached because
  // the user's session expired.
  // ==================================================

  const searchParams = new URLSearchParams(
    location.search
  );

  const sessionExpired =
    searchParams.get("sessionExpired") === "true";


  // ==================================================
  // Get the page that the user originally wanted.
  // ==================================================

  const fromQuery =
    searchParams.get("from");

  const redirectTo =
    fromQuery ||
    location.state?.from ||
    null;


  // ==================================================
  // Login submit
  // ==================================================

  const handleSubmit = async (event) => {

    // Stop browser from reloading the page
    event.preventDefault();

    setError("");


    // ==================================================
    // Simple client-side validation
    // ==================================================

    if (!username.trim() || !password) {

      setError(
        "Please enter both username and password."
      );

      return;
    }


    setLoading(true);


    try {

      // ==================================================
      // Send login request
      // ==================================================

      const response = await api.post(
        "/auth/login",
        {
          username,
          password,
        }
      );


      // ==================================================
      // Save JWT + user information
      // ==================================================

      saveAuth(
        response.data.token,
        response.data.user
      );


      // ==================================================
      // Redirect after successful login
      // ==================================================

      const role =
        response.data.user.role;


      // --------------------------------------------------
      // If the user was redirected because of session
      // expiry, return them to their original page.
      // --------------------------------------------------

      if (
        redirectTo &&
        !redirectTo.startsWith("/login")
      ) {

        navigate(
          redirectTo,
          { replace: true }
        );

      }

      // --------------------------------------------------
      // Normal admin login
      // --------------------------------------------------

      else if (role === "admin") {

        navigate(
          "/admin",
          { replace: true }
        );

      }

      // --------------------------------------------------
      // Normal student login
      // --------------------------------------------------

      else {

        navigate(
          "/student",
          { replace: true }
        );

      }

    } catch (error) {

      // ==================================================
      // Server responded with an error
      // ==================================================

      if (error.response) {

        // ------------------------------------------------
        // Normal login failure
        // ------------------------------------------------
        //
        // The Axios interceptor ignores /auth/login,
        // so a 401 reaches here normally.
        // ------------------------------------------------

        if (error.response.status === 401) {

          setError(
            "Invalid username or password"
          );

        } else {

          setError(
            error.response.data?.message ||
            `Login failed (status ${error.response.status})`
          );

        }

      }

      // ==================================================
      // Network/server connection failure
      // ==================================================

      else {

        setError(
          "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
        );

      }

    } finally {

      setLoading(false);

    }
  };


  return (

    <>
      <Navbar />


      <div className="login-container">

        <h1>Login</h1>


        <p className="login-subtitle">
          Sign in to enroll in courses.
        </p>


        {/* ==================================================
            Session Expired Message
            ================================================== */}

        {sessionExpired && (

          <p className="error">

            Your session has expired.
            Please log in again.

          </p>

        )}


        <form onSubmit={handleSubmit}>

          {/* ==================================================
              Username
              ================================================== */}

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>


            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* ==================================================
              Password
              ================================================== */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>


            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>


          {/* ==================================================
              Login Error
              ================================================== */}

          {error && (

            <p className="error">
              {error}
            </p>

          )}


          {/* ==================================================
              Login Button
              ================================================== */}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >

            <FaSignInAlt />

            {loading
              ? "Logging in..."
              : "Login"
            }

          </button>

        </form>


        {/* ==================================================
            Browse Courses
            ================================================== */}

        <p className="login-footer">

          Not sure where to go?{" "}

          <Link to="/courses">

            <FaSearch />

            {" "}Browse the courses

          </Link>

          {" "}first.

        </p>

      </div>

    </>
  );
}


export default Login;

