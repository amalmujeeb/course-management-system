import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaSort,
  FaSortDown,
  FaSortUp,
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
  max_students: "",
};

const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


// Columns that can be sorted
const SORTABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "level", label: "Level" },
  { key: "duration", label: "Duration" },
  { key: "price", label: "Price", numeric: true },
];


// ======================================================
// Load the course list
// ======================================================

async function fetchAllCourses() {

  const response =
    await api.get("/courses");

  return response.data.courses;
}


function ManageCourses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  // ======================================================
  // Form visibility / editing
  // ======================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);


  const [formData, setFormData] =
    useState(EMPTY_COURSE);

  const [formError, setFormError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [saving, setSaving] =
    useState(false);


  // ======================================================
  // Search / filter / sort state
  // ======================================================

  const [searchText, setSearchText] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [selectedLevel, setSelectedLevel] =
    useState("All");

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [sortColumn, setSortColumn] =
    useState(null);

  const [sortDirection, setSortDirection] =
    useState("asc");


  // ======================================================
  // Load courses when page opens
  // ======================================================

  useEffect(() => {

    const loadCourses = async () => {

      try {

        setCourses(
          await fetchAllCourses()
        );

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


  // ======================================================
  // Refresh courses
  // ======================================================

  const refreshCourses = async () => {

    setCourses(
      await fetchAllCourses()
    );

  };


  // ======================================================
  // Category options
  // ======================================================

  const categoryOptions = useMemo(() => {

    const uniqueCategories =
      new Set(
        courses
          .map((course) => course.category)
          .filter(Boolean)
      );


    return [
      "All",
      ...uniqueCategories,
    ];

  }, [courses]);


  const levelOptions = [
    "All",
    ...LEVEL_OPTIONS,
  ];


  // ======================================================
  // Sorting
  // ======================================================

  const handleSort = (columnKey) => {

    if (sortColumn === columnKey) {

      setSortDirection(
        (direction) =>
          direction === "asc"
            ? "desc"
            : "asc"
      );

    } else {

      setSortColumn(columnKey);

      setSortDirection("asc");

    }

  };


  // ======================================================
  // Reset filters
  // ======================================================

  const resetFilters = () => {

    setSearchText("");

    setSelectedCategory("All");

    setSelectedLevel("All");

    setMinPrice("");

    setMaxPrice("");

    setSortColumn(null);

    setSortDirection("asc");

  };


  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortColumn !== null;


  // ======================================================
  // Filter courses
  // ======================================================

  const filteredCourses =
    courses.filter((course) => {

      const search =
        searchText
          .trim()
          .toLowerCase();


      const title =
        String(course.title || "")
          .toLowerCase();


      const category =
        String(course.category || "")
          .toLowerCase();


      const courseId =
        String(course.id ?? "")
          .toLowerCase();


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


      const coursePrice =
        Number(course.price) || 0;


      const matchesMinPrice =
        minPrice === "" ||
        coursePrice >= Number(minPrice);


      const matchesMaxPrice =
        maxPrice === "" ||
        coursePrice <= Number(maxPrice);


      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel &&
        matchesMinPrice &&
        matchesMaxPrice
      );

    });


  // ======================================================
  // Apply sorting
  // ======================================================

  const displayedCourses =
    [...filteredCourses].sort(
      (courseA, courseB) => {

        if (!sortColumn) {
          return 0;
        }


        const column =
          SORTABLE_COLUMNS.find(
            (item) =>
              item.key === sortColumn
          );


        let comparison;


        if (column?.numeric) {

          const valueA =
            Number(
              courseA[sortColumn]
            ) || 0;

          const valueB =
            Number(
              courseB[sortColumn]
            ) || 0;


          comparison =
            valueA - valueB;

        } else {

          const valueA =
            String(
              courseA[sortColumn] ?? ""
            );


          const valueB =
            String(
              courseB[sortColumn] ?? ""
            );


          comparison =
            valueA.localeCompare(
              valueB,
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              }
            );

        }


        return sortDirection === "asc"
          ? comparison
          : -comparison;

      }
    );


  // ======================================================
  // Sort icon
  // ======================================================

  const renderSortIcon =
    (columnKey) => {

      if (
        sortColumn !== columnKey
      ) {

        return (
          <FaSort
            className="sort-icon sort-icon-inactive"
          />
        );

      }


      return sortDirection === "asc"
        ? (
          <FaSortUp
            className="sort-icon"
          />
        )
        : (
          <FaSortDown
            className="sort-icon"
          />
        );

    };


  // ======================================================
  // Form change
  // ======================================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setFormData({
        ...formData,
        [name]: value,
      });


      if (fieldErrors[name]) {

        setFieldErrors({
          ...fieldErrors,
          [name]: "",
        });

      }

    };


  // ======================================================
  // Open Add form
  // ======================================================

  const openAddForm = () => {

    setShowForm(true);

    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");

    setFieldErrors({});

    setError("");

    setSuccess("");

  };


  // ======================================================
  // Open Edit form
  // ======================================================

  const openEditForm =
    (course) => {

      setShowForm(true);

      setEditingId(course.id);


      setFormData({

        title:
          course.title || "",

        category:
          course.category || "",

        level:
          course.level ||
          "Beginner",

        duration:
          course.duration || "",

        price:
          String(
            course.price ?? ""
          ),

        image:
          course.image || "",

        description:
          course.description || "",

        max_students:
          course.max_students === null ||
          course.max_students === undefined
            ? ""
            : String(
                course.max_students
              ),

      });


      setFormError("");

      setFieldErrors({});

      setError("");

      setSuccess("");

    };


  // ======================================================
  // Close form
  // ======================================================

  const closeForm = () => {

    setShowForm(false);

    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");

    setFieldErrors({});

  };


  // ======================================================
  // Create / Update course
  // ======================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setFormError("");

      setFieldErrors({});

      setError("");

      setSuccess("");


      // Blank Maximum Students means unlimited.
      const maxStudents =
        formData.max_students
          .trim() === ""
          ? null
          : Number(
              formData.max_students
            );


      const coursePayload = {

        title:
          formData.title.trim(),

        category:
          formData.category.trim(),

        level:
          formData.level,

        duration:
          formData.duration.trim(),

        price:
          Number(formData.price),

        image:
          formData.image.trim(),

        description:
          formData.description.trim(),

        max_students:
          maxStudents,

      };


      setSaving(true);


      try {

        if (editingId) {

          // --------------------------------------------
          // Update existing course
          // --------------------------------------------

          const response =
            await api.put(
              `/courses/${editingId}`,
              coursePayload
            );


          setSuccess(
            response.data.message
          );

        } else {

          // --------------------------------------------
          // Create new course
          // --------------------------------------------

          const response =
            await api.post(
              "/courses",
              coursePayload
            );


          setSuccess(
            response.data.message
          );

        }


        closeForm();


        // Reload fresh backend data
        await refreshCourses();

      } catch (error) {

        if (
          error.response?.data?.errors
        ) {

          setFieldErrors(
            error.response.data.errors
          );

        }


        setFormError(
          error.response?.data?.message ||
          "Could not save the course. Please try again."
        );

      } finally {

        setSaving(false);

      }

    };


  // ======================================================
  // Delete course
  // ======================================================

  const handleDelete =
    async (course) => {

      const confirmed =
        window.confirm(
          `Delete "${course.title}"? This cannot be undone.`
        );


      if (!confirmed) {
        return;
      }


      setError("");

      setSuccess("");


      try {

        const response =
          await api.delete(
            `/courses/${course.id}`
          );


        setSuccess(
          response.data.message
        );


        await refreshCourses();

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Could not delete the course."
        );

      }

    };


  // ======================================================
  // Availability display helper
  // ======================================================

  const getAvailabilityText =
    (course) => {

      // Unlimited course
      if (
        course.max_students === null ||
        course.max_students === undefined
      ) {

        return "Unlimited";

      }


      // Full course
      if (
        course.is_full === true ||
        Number(course.seats_remaining) <= 0
      ) {

        return "Course Full";

      }


      // Limited course
      return `${course.enrolled_count || 0} / ${course.max_students} students`;

    };


  // ======================================================
  // Availability class helper
  // ======================================================

  const getAvailabilityClass =
    (course) => {

      if (
        course.max_students === null ||
        course.max_students === undefined
      ) {

        return "course-availability availability-unlimited";

      }


      if (
        course.is_full === true ||
        Number(course.seats_remaining) <= 0
      ) {

        return "course-availability availability-full";

      }


      return "course-availability availability-available";

    };


  // ======================================================
  // JSX
  // ======================================================

  return (

    <>

      <Navbar />


      <div className="container">


        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="page-header">

          <div>

            <h1>
              Manage Courses
            </h1>


            <p className="page-subtitle">
              Add new courses, update the existing ones,
              or remove courses that are no longer offered.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openAddForm
            }
          >

            {showForm
              ? <FaTimes />
              : <FaPlus />}


            {showForm
              ? "Cancel"
              : "Add Course"}

          </button>

        </div>


        {/* ==================================================
            SUCCESS / ERROR
        ================================================== */}

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


        {/* ==================================================
            SEARCH / FILTERS
        ================================================== */}

        {!loading &&
          courses.length > 0 && (

            <div className="filter-bar filter-bar-admin">

              <input
                type="text"
                className="input"
                placeholder="Search by title, category or course ID..."
                value={searchText}
                onChange={
                  (event) =>
                    setSearchText(
                      event.target.value
                    )
                }
              />


              <select
                className="input"
                value={selectedCategory}
                onChange={
                  (event) =>
                    setSelectedCategory(
                      event.target.value
                    )
                }
              >

                {categoryOptions.map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>


              <select
                className="input"
                value={selectedLevel}
                onChange={
                  (event) =>
                    setSelectedLevel(
                      event.target.value
                    )
                }
              >

                {levelOptions.map(
                  (level) => (

                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>

                  )
                )}

              </select>


              <input
                type="number"
                min="0"
                className="input"
                placeholder="Min Price"
                value={minPrice}
                onChange={
                  (event) =>
                    setMinPrice(
                      event.target.value
                    )
                }
              />


              <input
                type="number"
                min="0"
                className="input"
                placeholder="Max Price"
                value={maxPrice}
                onChange={
                  (event) =>
                    setMaxPrice(
                      event.target.value
                    )
                }
              />


              <button
                type="button"
                className="btn btn-outline"
                onClick={resetFilters}
                disabled={
                  !hasActiveFilters
                }
              >
                Reset Filters
              </button>

            </div>

          )}


        {/* ==================================================
            ADD / EDIT FORM
        ================================================== */}

        {showForm && (

          <section className="section-card">


            <div className="section-card-header">

              <h2>
                {editingId
                  ? "Edit Course"
                  : "New Course"}
              </h2>

            </div>


            <form
              className="form"
              onSubmit={handleSubmit}
            >


              {/* ------------------------------------------
                  TITLE + CATEGORY
              ------------------------------------------ */}

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
                    <span className="field-error">
                      {fieldErrors.title}
                    </span>
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
                    <span className="field-error">
                      {fieldErrors.category}
                    </span>
                  )}

                </div>

              </div>


              {/* ------------------------------------------
                  LEVEL + DURATION + PRICE
              ------------------------------------------ */}

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

                    {LEVEL_OPTIONS.map(
                      (level) => (

                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>

                      )
                    )}

                  </select>


                  {fieldErrors.level && (
                    <span className="field-error">
                      {fieldErrors.level}
                    </span>
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
                    <span className="field-error">
                      {fieldErrors.duration}
                    </span>
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
                    <span className="field-error">
                      {fieldErrors.price}
                    </span>
                  )}

                </div>

              </div>


              {/* ------------------------------------------
                  MAXIMUM STUDENTS
              ------------------------------------------ */}

              <div className="form-group">

                <label htmlFor="max_students">
                  Maximum Students
                </label>


                <input
                  id="max_students"
                  className={`input ${
                    fieldErrors.max_students
                      ? "input-error"
                      : ""
                  }`}
                  type="number"
                  min="1"
                  step="1"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleChange}
                  placeholder="Leave blank for unlimited"
                />


                <small className="form-help">
                  Leave blank to allow unlimited
                  students.
                </small>


                {fieldErrors.max_students && (
                  <span className="field-error">
                    {fieldErrors.max_students}
                  </span>
                )}

              </div>


              {/* ------------------------------------------
                  IMAGE
              ------------------------------------------ */}

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
                  <span className="field-error">
                    {fieldErrors.image}
                  </span>
                )}

              </div>


              {/* ------------------------------------------
                  DESCRIPTION
              ------------------------------------------ */}

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
                  <span className="field-error">
                    {fieldErrors.description}
                  </span>
                )}

              </div>


              {/* ------------------------------------------
                  FORM ERROR
              ------------------------------------------ */}

              {formError && (
                <p className="error">
                  {formError}
                </p>
              )}


              {/* ------------------------------------------
                  FORM BUTTONS
              ------------------------------------------ */}

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


        {/* ==================================================
            COURSE TABLE
        ================================================== */}

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
              <FaEye />
              Manage enrollments
            </Link>

          </div>


          {loading && (
            <p className="loading">
              Loading courses...
            </p>
          )}


          {!loading &&
            courses.length === 0 && (

              <p className="empty">
                No courses yet. Click
                "Add Course" to create
                the first one.
              </p>

            )}


          {!loading &&
            courses.length > 0 && (

              <p className="result-count">
                Showing{" "}
                {displayedCourses.length}{" "}
                of{" "}
                {courses.length}{" "}
                courses
              </p>

            )}


          {!loading &&
            courses.length > 0 &&
            displayedCourses.length === 0 && (

              <p className="empty">
                No courses found.
              </p>

            )}


          {!loading &&
            displayedCourses.length > 0 && (

              <div className="table-wrapper">

                <table className="table">

                  <thead>

                    <tr>


                      {/* ID */}

                      {SORTABLE_COLUMNS
                        .slice(0, 1)
                        .map((column) => (

                          <th
                            key={column.key}
                            className="sortable-th"
                            aria-sort={
                              sortColumn ===
                              column.key
                                ? sortDirection ===
                                  "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                            onClick={() =>
                              handleSort(
                                column.key
                              )
                            }
                          >

                            <span className="th-content">

                              {column.label}

                              {renderSortIcon(
                                column.key
                              )}

                            </span>

                          </th>

                        ))}


                      <th>
                        Image
                      </th>


                      {/* Existing sortable columns */}

                      {SORTABLE_COLUMNS
                        .slice(1)
                        .map((column) => (

                          <th
                            key={column.key}
                            className="sortable-th"
                            aria-sort={
                              sortColumn ===
                              column.key
                                ? sortDirection ===
                                  "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                            onClick={() =>
                              handleSort(
                                column.key
                              )
                            }
                          >

                            <span className="th-content">

                              {column.label}

                              {renderSortIcon(
                                column.key
                              )}

                            </span>

                          </th>

                        ))}


                      {/* CR-007 */}

                      <th>
                        Availability
                      </th>


                      <th className="table-actions-column">
                        Actions
                      </th>


                    </tr>

                  </thead>


                  <tbody>

                    {displayedCourses.map(
                      (course) => (

                        <tr
                          key={course.id}
                        >


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


                          {/* --------------------------------
                              CR-007 Availability
                          -------------------------------- */}

                          <td>

                            <span
                              className={
                                getAvailabilityClass(
                                  course
                                )
                              }
                            >

                              {getAvailabilityText(
                                course
                              )}

                            </span>

                          </td>


                          {/* Actions */}

                          <td>

                            <div className="table-actions">


                              <button
                                type="button"
                                className="btn btn-small btn-outline"
                                onClick={() =>
                                  openEditForm(
                                    course
                                  )
                                }
                              >

                                <FaEdit />

                                Edit

                              </button>


                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() =>
                                  handleDelete(
                                    course
                                  )
                                }
                              >

                                <FaTrash />

                                Delete

                              </button>


                            </div>

                          </td>


                        </tr>

                      )
                    )}

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

