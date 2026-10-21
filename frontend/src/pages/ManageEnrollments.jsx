import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ManageEnrollments() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ q: "", courseId: "", from: "", to: "", sort: "date", order: "desc", limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get("/courses").then((response) => setCourses(response.data.courses || []))
      .catch((loadError) => console.error("Could not load course options:", loadError.message));
  }, []);

  useEffect(() => {
    let active = true;
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");
      try {
        const params = Object.fromEntries(Object.entries({ ...filters, page: pagination.page })
          .filter(([key, value]) => !["courseId", "from", "to"].includes(key) || value !== ""));
        const response = await api.get("/enrollments", { params });
        if (!active) return;
        const data = response.data;
        setEnrollments(data.enrollments || []);
        setPagination(data.pagination);
        if (data.pagination.page > data.pagination.totalPages && data.pagination.page > 1) {
          setPagination((current) => ({ ...current, page: Math.max(1, data.pagination.totalPages) }));
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError.response?.data?.message || "Failed to load enrollments");
        setEnrollments([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEnrollments();
    return () => { active = false; };
  }, [filters, pagination.page, reloadKey]);

  const updateFilter = (key, value) => {
    setSuccess("");
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(`Remove ${enrollment.full_name || enrollment.username} from "${enrollment.title}"?`);
    if (!confirmed) return;
    setError("");
    setSuccess("");
    try {
      const response = await api.delete(`/enrollments/${enrollment.id}`);
      setSuccess(response.data.message);
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Could not delete the enrollment.");
    }
  };

  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";
  const first = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const last = Math.min(pagination.page * pagination.limit, pagination.total);
  const goToPage = (page) => setPagination((current) => ({ ...current, page }));

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>
            <p className="page-subtitle">Search, filter, and manage course enrollments.</p>
          </div>
        </div>

        <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end" }}>
          <div className="form-group">
            <label htmlFor="enrollmentSearch">Search student</label>
            <input id="enrollmentSearch" className="input" value={filters.q} placeholder="Name or username"
              onChange={(event) => updateFilter("q", event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="courseFilter">Course</label>
            <select id="courseFilter" className="input" value={filters.courseId}
              onChange={(event) => updateFilter("courseId", event.target.value)}>
              <option value="">All courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="enrolledFrom">Enrolled from</label>
            <input id="enrolledFrom" type="date" className="input" value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="enrolledTo">Enrolled to</label>
            <input id="enrolledTo" type="date" className="input" value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="enrollmentSort">Sort by</label>
            <select id="enrollmentSort" className="input" value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}>
              <option value="date">Enrollment date</option><option value="student">Student</option><option value="course">Course</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="enrollmentOrder">Order</label>
            <select id="enrollmentOrder" className="input" value={filters.order}
              onChange={(event) => updateFilter("order", event.target.value)}>
              <option value="desc">Descending</option><option value="asc">Ascending</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pageSize">Rows per page</label>
            <select id="pageSize" className="input" value={filters.limit}
              onChange={(event) => updateFilter("limit", Number(event.target.value))}>
              {[20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        <section className="section-card">
          <div className="section-card-header">
            <h2>All Enrollments ({pagination.total})</h2>
            <p aria-live="polite">Showing {first}-{last} of {pagination.total}</p>
          </div>
          {loading && <p className="loading">Loading enrollments...</p>}
          {!loading && enrollments.length === 0 && <p className="empty">No enrollments match these filters.</p>}
          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Student</th><th>Username</th><th>Course</th><th>Category</th><th>Level</th><th>Enrolled On</th><th className="table-actions-column">Actions</th></tr></thead>
                <tbody>{enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.full_name}</td><td>{enrollment.username}</td><td>{enrollment.title}</td><td>{enrollment.category}</td>
                    <td><span className="tag tag-level">{enrollment.level}</span></td><td>{formatDate(enrollment.enrolled_at)}</td>
                    <td><button type="button" className="btn btn-small btn-danger" onClick={() => handleDelete(enrollment)}><FaTrash /> Remove</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", padding: "1rem" }}>
            <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} total records</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-small" disabled={loading || pagination.page <= 1} onClick={() => goToPage(1)}>First</button>
              <button className="btn btn-small" disabled={loading || pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>Previous</button>
              <button className="btn btn-small" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>Next</button>
              <button className="btn btn-small" disabled={loading || pagination.totalPages === 0 || pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.totalPages)}>Last</button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default ManageEnrollments;
