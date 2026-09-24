import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const EMPTY_COURSE = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: "",
  image: "",
  description: "",
};

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];


// Load the course list.
async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses;
}


function ManageCourses() {

//---------- Course list states ---------- 
const [courses, setCourses] = useState([]); 
const [loading, setLoading] = useState(true); 
const [error, setError] = useState(""); 

// ---------- Filter states ---------- 
const [searchText, setSearchText] = useState(""); 
const [selectedCategory, setSelectedCategory] = useState("All"); 
const [selectedLevel, setSelectedLevel] = useState("All"); 
const [minPrice, setMinPrice] = useState(""); 
const [maxPrice, setMaxPrice] = useState(""); 

// ---------- Form states ---------- 
const [showForm, setShowForm] = useState(false); 
const [editingId, setEditingId] = useState(null); 
const [formData, setFormData] = useState(EMPTY_COURSE); 
const [formError, setFormError] = useState(""); 
const [fieldErrors, setFieldErrors] = useState({}); 
const [saving, setSaving] = useState(false); 
const [success, setSuccess] = useState("");


  // ---------- Load the course list once, when the page opens ----------
  useEffect(() => {

    const loadCourses = async () => {

      try {

        setCourses(await fetchAllCourses());

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    loadCourses();

  }, []);


  // ---------- Reload the list after a create / update / delete ----------
const refreshCourses = async () => {
  setCourses(await fetchAllCourses());
};

    const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];

  const filteredCourses = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const title = String(course.title || "").toLowerCase();
      const category = String(course.category || "").toLowerCase();
      const courseId = String(course.id || "").toLowerCase();

      const matchesSearch =
        search === "" ||
        title.includes(search) ||
        category.includes(search) ||
        courseId.includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        course.category === selectedCategory;

      const matchesLevel =
        selectedLevel === "All" ||
        course.level === selectedLevel;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel
      );
    });
  }, [
    courses,
    searchText,
    selectedCategory,
    selectedLevel,
  ]);

  // ---------- Form helpers ----------

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the field-specific error when the user edits that field
    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };


  const openAddForm = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData(EMPTY_COURSE);
    setFormError("");
    setFieldErrors({});
    setError("");
    setSuccess("");
  };


  const openEditForm = (course) => {
    setShowForm(true);
    setEditingId(course.id);

    // Fill the form with the existing course values.
    setFormData({
      title: course.title || "",
      category: course.category || "",
      level: course.level || "Beginner",
      duration: course.duration || "",
      price: String(course.price ?? ""),
      image: course.image || "",
      description: course.description || "",
    });

    setFormError("");
    setFieldErrors({});
    setError("");
    setSuccess("");
  };


  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_COURSE);
    setFormError("");
    setFieldErrors({});
  };


  // ---------- Create / Update ----------
  const handleSubmit = async (event) => {

    // Stop the browser from reloading the page
    event.preventDefault();

    setFormError("");
    setFieldErrors({});
    setError("");
    setSuccess("");


    // ---------- Client side validation ----------
    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.level
    ) {
      setFormError("Title, category and level are required.");
      return;
    }

    if (!formData.duration.trim()) {
      setFormError("Duration is required (for example: 8 Weeks).");
      return;
    }

    if (formData.price === "" || Number(formData.price) < 0) {
      setFormError("Please enter a valid price.");
      return;
    }


    // The backend expects price to be a number
    const coursePayload = {
      title: formData.title.trim(),
      category: formData.category.trim(),
      level: formData.level,
      duration: formData.duration.trim(),
      price: Number(formData.price),
      image: formData.image.trim(),
      description: formData.description.trim(),
    };


    setSaving(true);

    try {

      if (editingId) {

        // ---------- Update an existing course ----------
        const response = await api.put(
          `/courses/${editingId}`,
          coursePayload
        );

        setSuccess(response.data.message);

      } else {

        // ---------- Create a new course ----------
        const response = await api.post(
          "/courses",
          coursePayload
        );

        setSuccess(response.data.message);

      }

      closeForm();

      // Show fresh data from the backend
      await refreshCourses();

    } catch (error) {

      // Backend validation errors
      const responseData = error.response?.data;

      if (responseData?.errors) {

        setFieldErrors(responseData.errors);

        setFormError(
          responseData.message || "Validation failed"
        );

      } else {

        setFormError(
          responseData?.message ||
          "Could not save the course. Please try again."
        );

      }

    } finally {

      setSaving(false);

    }
  };


  // ---------- Delete ----------
  const handleDelete = async (course) => {

    // Always confirm before a destructive action
    const confirmed = window.confirm(
      `Delete "${course.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {

      const response = await api.delete(
        `/courses/${course.id}`
      );

      setSuccess(response.data.message);

      await refreshCourses();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the course."
      );

    }
  };


return (

  <>
    <Navbar />

    <div className="container">

      {/* ---------- Page Header ---------- */}

      <div className="page-header">

        <div>
          <h1>Manage Courses</h1>

          <p className="page-subtitle">
            Add new courses, update the existing ones, or remove courses
            that are no longer offered.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={showForm ? closeForm : openAddForm}
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? "Cancel" : "Add Course"}
        </button>

      </div>


      {/* ---------- Search and Filters ---------- */}

      {!loading && courses.length > 0 && (

        <section className="section-card">

          <div className="section-card-header">
            <h2>Search & Filter Courses</h2>
          </div>

          <div className="form-row">

            {/* Search */}

            <div className="form-group">

              <label htmlFor="course-search">
                Search
              </label>

              <input
                id="course-search"
                type="text"
                className="input"
                placeholder="Search by title, category or course ID"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />

            </div>


            {/* Category */}

            <div className="form-group">

              <label htmlFor="category-filter">
                Category
              </label>

              <select
                id="category-filter"
                className="input"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
              >

                {categories.map((category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                ))}

              </select>

            </div>


            {/* Level */}

            <div className="form-group">

              <label htmlFor="level-filter">
                Level
              </label>

              <select
                id="level-filter"
                className="input"
                value={selectedLevel}
                onChange={(event) =>
                  setSelectedLevel(event.target.value)
                }
              >

                <option value="All">
                  All
                </option>

                {LEVEL_OPTIONS.map((level) => (

                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>

                ))}

              </select>

            </div>

          </div>

        </section>

      )}


      {/* ---------- Result Counter ---------- */}

      {!loading && courses.length > 0 && (

        <p className="result-count">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>

      )}


      {/* ---------- Success / Error Messages ---------- */}

      {success && (
        <p className="success">
          {success}
        </p>
      )}

      {error && (
        <p className="error">
          {error}
        </p>
      )}


      {/* ---------- Add / Edit Form ---------- */}

      {showForm && (

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              {editingId ? "Edit Course" : "New Course"}
            </h2>

          </div>


          <form
            className="form"
            onSubmit={handleSubmit}
          >

            {/* ---------- Title + Category ---------- */}

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="title">
                  Title *
                </label>

                <input
                  id="title"
                  className={`input ${
                    fieldErrors.title
                      ? "input-error"
                      : ""
                  }`}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. React"
                />

                {fieldErrors.title && (
                  <p className="field-error">
                    {fieldErrors.title}
                  </p>
                )}

              </div>


              <div className="form-group">

                <label htmlFor="category">
                  Category *
                </label>

                <input
                  id="category"
                  className={`input ${
                    fieldErrors.category
                      ? "input-error"
                      : ""
                  }`}
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Frontend"
                />

                {fieldErrors.category && (
                  <p className="field-error">
                    {fieldErrors.category}
                  </p>
                )}

              </div>

            </div>


            {/* ---------- Level + Duration + Price ---------- */}

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="level">
                  Level *
                </label>

                <select
                  id="level"
                  className={`input ${
                    fieldErrors.level
                      ? "input-error"
                      : ""
                  }`}
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >

                  {LEVEL_OPTIONS.map((level) => (

                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>

                  ))}

                </select>

                {fieldErrors.level && (
                  <p className="field-error">
                    {fieldErrors.level}
                  </p>
                )}

              </div>


              <div className="form-group">

                <label htmlFor="duration">
                  Duration *
                </label>

                <input
                  id="duration"
                  className={`input ${
                    fieldErrors.duration
                      ? "input-error"
                      : ""
                  }`}
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g. 10 Weeks"
                />

                {fieldErrors.duration && (
                  <p className="field-error">
                    {fieldErrors.duration}
                  </p>
                )}

              </div>


              <div className="form-group">

                <label htmlFor="price">
                  Price (Rs.) *
                </label>

                <input
                  id="price"
                  className={`input ${
                    fieldErrors.price
                      ? "input-error"
                      : ""
                  }`}
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 25000"
                />

                {fieldErrors.price && (
                  <p className="field-error">
                    {fieldErrors.price}
                  </p>
                )}

              </div>

            </div>


            {/* ---------- Image ---------- */}

            <div className="form-group">

              <label htmlFor="image">
                Image URL
              </label>

              <input
                id="image"
                className={`input ${
                  fieldErrors.image
                    ? "input-error"
                    : ""
                }`}
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://placehold.co/300x180?text=React"
              />

              {fieldErrors.image && (
                <p className="field-error">
                  {fieldErrors.image}
                </p>
              )}

            </div>


            {/* ---------- Description ---------- */}

            <div className="form-group">

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                className={`input ${
                  fieldErrors.description
                    ? "input-error"
                    : ""
                }`}
                rows="4"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short summary of what students will learn."
              />

              {fieldErrors.description && (
                <p className="field-error">
                  {fieldErrors.description}
                </p>
              )}

            </div>


            {/* ---------- General Form Error ---------- */}

            {formError && (
              <p className="error">
                {formError}
              </p>
            )}


            {/* ---------- Form Actions ---------- */}

            <div className="form-actions">

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >

                <FaSave />

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Course"
                    : "Create Course"}

              </button>


              <button
                type="button"
                className="btn btn-outline"
                onClick={closeForm}
                disabled={saving}
              >

                <FaTimes />
                Cancel

              </button>

            </div>

          </form>

        </section>

      )}


      {/* ---------- No Matching Courses ---------- */}

      {!loading &&
        courses.length > 0 &&
        filteredCourses.length === 0 && (

          <p className="empty">
            No courses found.
          </p>

      )}


      {/* ---------- Course Table ---------- */}

      <section className="section-card">

        <div className="section-card-header">

          <h2>
            All Courses
            {courses.length > 0
              ? ` (${courses.length})`
              : ""}
          </h2>

          <Link
            to="/admin/enrollments"
            className="link-inline"
          >
            <FaEye /> Manage enrollments
          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">
            Loading courses...
          </p>
        )}


        {/* ---------- Empty Course List ---------- */}

        {!loading && courses.length === 0 && (
          <p className="empty">
            No courses yet. Click "Add Course" to create the first one.
          </p>
        )}


        {/* ---------- Filtered Course Table ---------- */}

        {!loading &&
          courses.length > 0 &&
          filteredCourses.length > 0 && (

            <div className="table-wrapper">

              <table className="table">

                <thead>

                  <tr>

                    <th>ID</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Price</th>

                    <th className="table-actions-column">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredCourses.map((course) => (

                    <tr key={course.id}>

                      <td>
                        {course.id}
                      </td>


                      <td>

                        <img
                          src={course.image}
                          alt={course.title}
                          className="table-thumb"
                        />

                      </td>


                      <td>
                        {course.title}
                      </td>


                      <td>
                        {course.category}
                      </td>


                      <td>

                        <span className="tag tag-level">
                          {course.level}
                        </span>

                      </td>


                      <td>
                        {course.duration}
                      </td>


                      <td>
                        Rs. {course.price}
                      </td>


                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            className="btn btn-small btn-outline"
                            onClick={() =>
                              openEditForm(course)
                            }
                          >

                            <FaEdit />
                            Edit

                          </button>


                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() =>
                              handleDelete(course)
                            }
                          >

                            <FaTrash />
                            Delete

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

      </section>

    </div>

    <Footer />

  </>
); 
}

export default ManageCourses;