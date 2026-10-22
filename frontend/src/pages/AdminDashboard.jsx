import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaChartBar, FaSearch, FaUsers } from "react-icons/fa";
import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const emptyReport = {
  totalCourses: 0,
  totalStudents: 0,
  totalEnrollments: 0,
  studentsWithEnrollments: 0,
  enrollmentsLast30Days: 0,
  coursesWithoutEnrollments: 0,
  enrollmentsByCategory: [],
  topCourses: [],
  recentEnrollments: [],
};

function AdminDashboard() {
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    api.get("/reports/overview")
      .then(({ data }) => setReport({ ...emptyReport, ...data.report }))
      .catch((requestError) => setError(
        requestError.response?.data?.message || "Failed to load the overview report"
      ))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";
  const maxCategoryCount = Math.max(0, ...report.enrollmentsByCategory.map((item) => item.enrollmentCount));
  const cards = [
    ["Total Courses", report.totalCourses],
    ["Total Students", report.totalStudents],
    ["Total Enrollments", report.totalEnrollments],
    ["Students with Enrollments", report.studentsWithEnrollments],
    ["Enrollments in Last 30 Days", report.enrollmentsLast30Days],
    ["Courses without Enrollments", report.coursesWithoutEnrollments],
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name || user?.username}. Here is an overview of the system.</p>
          </div>
          <Link to="/admin/courses" className="btn btn-primary"><FaChartBar /> Manage Courses</Link>
        </div>

        {error && <p className="error" role="alert">{error}. Report figures are shown as zero until the report is available.</p>}
        {loading && <p className="loading">Loading report...</p>}

        <div className="dashboard-grid">
          {cards.map(([label, value]) => (
            <div className="dashboard-card" key={label}>
              <span className="dashboard-card-value">{loading ? "..." : value}</span>
              <span className="dashboard-card-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="report-grid">
          <section className="section-card">
            <div className="section-card-header"><h2>Enrollments by Category</h2></div>
            {report.enrollmentsByCategory.length === 0 ? <p className="empty">No enrollment data by category yet.</p> : (
              <div className="report-bars">
                {report.enrollmentsByCategory.map(({ category, enrollmentCount }) => (
                  <div className="report-bar-row" key={category}>
                    <div className="report-bar-label"><span>{category}</span><strong>{enrollmentCount}</strong></div>
                    <div className="report-bar-track"><span style={{ width: `${maxCategoryCount ? (enrollmentCount / maxCategoryCount) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="section-card-header"><h2>Top Five Courses</h2></div>
            {report.topCourses.length === 0 ? <p className="empty">No course enrollments yet.</p> : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Course</th><th>Category</th><th>Enrollments</th></tr></thead>
                  <tbody>{report.topCourses.map((course) => (
                    <tr key={course.courseId}><td>{course.title}</td><td>{course.category}</td><td>{course.enrollmentCount}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="link-inline">Manage enrollments</Link>
          </div>
          {!loading && report.recentEnrollments.length === 0 ? <p className="empty">No enrollments have been made yet.</p> : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Student</th><th>Username</th><th>Course</th><th>Category</th><th>Level</th><th>Enrolled On</th></tr></thead>
                <tbody>{report.recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.full_name}</td><td>{enrollment.username}</td><td>{enrollment.title}</td>
                    <td>{enrollment.category}</td><td><span className="tag tag-level">{enrollment.level}</span></td>
                    <td>{formatDate(enrollment.enrolled_at)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header"><h2>Administration</h2></div>
          <div className="quick-actions">
            <Link to="/admin/courses" className="quick-action"><span className="quick-action-icon"><FaBook /></span><span>Add, edit and delete courses</span></Link>
            <Link to="/admin/enrollments" className="quick-action"><span className="quick-action-icon"><FaUsers /></span><span>View and remove enrollments</span></Link>
            <Link to="/courses" className="quick-action"><span className="quick-action-icon"><FaSearch /></span><span>See the public course list</span></Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default AdminDashboard;
