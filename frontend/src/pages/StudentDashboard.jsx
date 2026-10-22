import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaEye, FaGraduationCap, FaSearch } from "react-icons/fa";
import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const emptyReport = {
  enrolledCourses: 0,
  distinctCategories: 0,
  earliestEnrollment: null,
  latestEnrollment: null,
  recentEnrollments: [],
};

function StudentDashboard() {
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    api.get("/reports/my")
      .then(({ data }) => setReport({ ...emptyReport, ...data.report }))
      .catch((requestError) => setError(
        requestError.response?.data?.message || "Failed to load your learning report"
      ))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name || user?.username}!</p>
          </div>
          <Link to="/courses" className="btn btn-primary"><FaSearch /> Browse Courses</Link>
        </div>

        {error && <p className="error" role="alert">{error}. Your report figures are shown as zero until it is available.</p>}
        {loading && <p className="loading">Loading your report...</p>}

        <div className="dashboard-grid">
          <div className="dashboard-card"><span className="dashboard-card-value">{loading ? "..." : report.enrolledCourses}</span><span className="dashboard-card-label">My Enrolled Courses</span></div>
          <div className="dashboard-card"><span className="dashboard-card-value">{loading ? "..." : report.distinctCategories}</span><span className="dashboard-card-label">Categories Explored</span></div>
          <div className="dashboard-card"><span className="dashboard-card-value dashboard-card-date">{loading ? "..." : formatDate(report.earliestEnrollment)}</span><span className="dashboard-card-label">First Enrollment</span></div>
          <div className="dashboard-card"><span className="dashboard-card-value dashboard-card-date">{loading ? "..." : formatDate(report.latestEnrollment)}</span><span className="dashboard-card-label">Latest Enrollment</span></div>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollments</h2>
            <Link to="/my-enrollments" className="link-inline"><FaEye /> View all</Link>
          </div>
          {!loading && report.recentEnrollments.length === 0 ? <p className="empty">You have not enrolled in any courses yet. Browse courses to get started.</p> : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Course</th><th>Category</th><th>Level</th><th>Enrolled On</th></tr></thead>
                <tbody>{report.recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td><Link to={`/courses/${enrollment.course_id}`}>{enrollment.title}</Link></td>
                    <td>{enrollment.category}</td><td>{enrollment.level}</td><td>{formatDate(enrollment.enrolled_at)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header"><h2>Quick Actions</h2></div>
          <div className="quick-actions">
            <Link to="/courses" className="quick-action"><span className="quick-action-icon"><FaBook /></span><span>Browse all courses</span></Link>
            <Link to="/my-enrollments" className="quick-action"><span className="quick-action-icon"><FaGraduationCap /></span><span>View my enrollments</span></Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default StudentDashboard;
