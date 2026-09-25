import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  // ---------- Load the logged-in student's enrollments ----------
  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response = await api.get("/enrollments/my");

        setEnrollments(response.data.enrollments || []);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }
    };

    getEnrollments();

  }, []);


  // ---------- Format enrollment date ----------
  const formatDate = (value) => {

    if (!value) return "-";

    return new Date(value).toLocaleDateString();

  };


  // ---------- Safe price conversion ----------
  const getSafePrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice) ? numericPrice : 0;

  };


  // ---------- Enrollment Summary ----------

  const totalEnrolledCourses = enrollments.length;


  const totalEnrolledValue = enrollments.reduce(
    (total, enrollment) =>
      total + getSafePrice(enrollment.price),
    0
  );


  const averageCoursePrice =
    totalEnrolledCourses > 0
      ? totalEnrolledValue / totalEnrolledCourses
      : 0;


  const distinctCategories = new Set(
    enrollments
      .map((enrollment) => enrollment.category)
      .filter(Boolean)
  ).size;


  // ---------- Sort enrollments ----------
  // Create a copy so the original API array is not modified.

  const sortedEnrollments = [...enrollments].sort(
    (a, b) => {

      switch (sortOption) {

        case "newest":
          return (
            new Date(b.enrolled_at).getTime() -
            new Date(a.enrolled_at).getTime()
          );


        case "oldest":
          return (
            new Date(a.enrolled_at).getTime() -
            new Date(b.enrolled_at).getTime()
          );


        case "priceHigh":
          return (
            getSafePrice(b.price) -
            getSafePrice(a.price)
          );


        case "priceLow":
          return (
            getSafePrice(a.price) -
            getSafePrice(b.price)
          );


        case "titleAZ":
          return (a.title || "").localeCompare(
            b.title || "",
            undefined,
            {
              sensitivity: "base",
            }
          );


        default:
          return (
            new Date(b.enrolled_at).getTime() -
            new Date(a.enrolled_at).getTime()
          );

      }

    }
  );


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Page Header ---------- */}

        <div className="page-header">

          <div>

            <h1>My Enrollments</h1>

            <p className="page-subtitle">

              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}

            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">
            Loading your enrollments...
          </p>
        )}


        {/* ---------- Error ---------- */}

        {error && !loading && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- Empty State ---------- */}

        {!loading &&
          !error &&
          enrollments.length === 0 && (

            <div className="empty-box">

              <p className="empty">
                You have not enrolled in any courses yet.
              </p>

              <Link
                to="/courses"
                className="btn btn-primary"
              >
                <FaSearch />
                Find a Course
              </Link>

            </div>

          )}


        {/* ---------- Enrollment Summary ---------- */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <section className="section-card">

              <div className="section-card-header">

                <h2>Enrollment Summary</h2>

              </div>


              <div className="dashboard-grid">


                {/* Total Courses */}

                <div className="dashboard-card">

                  <span className="dashboard-card-value">
                    {totalEnrolledCourses}
                  </span>

                  <span className="dashboard-card-label">
                    Total Enrolled Courses
                  </span>

                </div>


                {/* Total Value */}

                <div className="dashboard-card">

                  <span className="dashboard-card-value">
                    Rs. {totalEnrolledValue.toFixed(2)}
                  </span>

                  <span className="dashboard-card-label">
                    Total Course Value
                  </span>

                </div>


                {/* Average Price */}

                <div className="dashboard-card">

                  <span className="dashboard-card-value">
                    Rs. {averageCoursePrice.toFixed(2)}
                  </span>

                  <span className="dashboard-card-label">
                    Average Course Price
                  </span>

                </div>


                {/* Distinct Categories */}

                <div className="dashboard-card">

                  <span className="dashboard-card-value">
                    {distinctCategories}
                  </span>

                  <span className="dashboard-card-label">
                    Distinct Categories
                  </span>

                </div>


              </div>

            </section>

          )}


        {/* ---------- Sorting Controls ---------- */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <section className="section-card">

              <div className="section-card-header">

                <h2>Sort Enrollments</h2>


                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(event.target.value)
                  }
                  className="form-control"
                  aria-label="Sort enrollments"
                >

                  <option value="newest">
                    Newest Enrolled
                  </option>

                  <option value="oldest">
                    Oldest Enrolled
                  </option>

                  <option value="priceHigh">
                    Price: High to Low
                  </option>

                  <option value="priceLow">
                    Price: Low to High
                  </option>

                  <option value="titleAZ">
                    Course Title: A to Z
                  </option>

                </select>

              </div>

            </section>

          )}


        {/* ---------- Enrollment Cards ---------- */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <div className="course-grid">

              {sortedEnrollments.map((enrollment) => (

                <article
                  className="course-card"
                  key={enrollment.id}
                >


                  <img
                    src={enrollment.image}
                    alt={enrollment.title}
                    className="course-card-image"
                    loading="lazy"
                  />


                  <div className="course-card-body">


                    {/* Category + Level */}

                    <div className="course-card-tags">

                      <span className="tag tag-category">
                        {enrollment.category}
                      </span>

                      <span className="tag tag-level">
                        {enrollment.level}
                      </span>

                    </div>


                    {/* Course Title */}

                    <h3 className="course-card-title">
                      {enrollment.title}
                    </h3>


                    {/* Course Description */}

                    <p className="course-card-summary">

                      {enrollment.description?.slice(0, 100)}

                      {enrollment.description?.length > 100
                        ? "..."
                        : ""}

                    </p>


                    {/* Course Information */}

                    <ul className="course-card-meta">

                      <li>
                        <strong>Duration:</strong>{" "}
                        {enrollment.duration}
                      </li>


                      <li>
                        <strong>Price:</strong>{" "}
                        Rs. {getSafePrice(enrollment.price).toFixed(2)}
                      </li>


                      <li>
                        <strong>Enrolled on:</strong>{" "}
                        {formatDate(enrollment.enrolled_at)}
                      </li>

                    </ul>


                    {/* View Course */}

                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="btn btn-outline btn-block"
                    >
                      View Course
                    </Link>


                  </div>

                </article>

              ))}

            </div>

          )}

      </div>

      <Footer />

    </>

  );

}

export default MyEnrollments;