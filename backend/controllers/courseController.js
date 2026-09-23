const Course = require("../models/courseModel");
const User = require("../models/userModel");

// Reusable server-side course validation
const validateCourse = (course) => {
  const errors = {};

  const title =
    typeof course.title === "string" ? course.title.trim() : "";

  const category =
    typeof course.category === "string"
      ? course.category.trim()
      : "";

  const level =
    typeof course.level === "string"
      ? course.level.trim()
      : "";

  const duration =
    typeof course.duration === "string"
      ? course.duration.trim()
      : "";

  const image =
    typeof course.image === "string"
      ? course.image.trim()
      : "";

  const description =
    typeof course.description === "string"
      ? course.description.trim()
      : "";

  // -----------------------------
  // Title validation
  // -----------------------------
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must contain at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }

  // -----------------------------
  // Category validation
  // -----------------------------
  if (!category) {
    errors.category = "Category is required";
  } else if (category.length < 2) {
    errors.category = "Category must contain at least 2 characters";
  } else if (category.length > 50) {
    errors.category = "Category must not exceed 50 characters";
  }

  // -----------------------------
  // Level validation
  // -----------------------------
  if (!["Beginner", "Intermediate", "Advanced"].includes(level)) {
    errors.level =
      "Level must be Beginner, Intermediate, or Advanced";
  }

  // -----------------------------
  // Duration validation
  // -----------------------------
  if (!duration) {
    errors.duration = "Duration is required";
  } else if (
    !/^[1-9]\d* (Days|Weeks|Months)$/.test(duration)
  ) {
    errors.duration =
      "Duration must be a positive integer followed by Days, Weeks, or Months";
  }

  // -----------------------------
  // Price validation
  // -----------------------------
  if (
    course.price === undefined ||
    course.price === null ||
    course.price === ""
  ) {
    errors.price = "Price is required";
  } else {
    const priceString = String(course.price).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(priceString)) {
      errors.price =
        "Price must be numeric with no more than two decimal places";
    } else {
      const price = Number(priceString);

      if (price < 0) {
        errors.price = "Price cannot be negative";
      } else if (price > 1000000) {
        errors.price = "Price cannot exceed 1,000,000";
      }
    }
  }

  // -----------------------------
  // Image validation
  // -----------------------------
  if (image) {
    if (image.length > 500) {
      errors.image = "Image URL must not exceed 500 characters";
    } else {
      try {
        const imageUrl = new URL(image);

        if (
          imageUrl.protocol !== "http:" &&
          imageUrl.protocol !== "https:"
        ) {
          errors.image =
            "Image must be a valid HTTP or HTTPS URL";
        }
      } catch (error) {
        errors.image =
          "Image must be a valid HTTP or HTTPS URL";
      }
    }
  }

  // -----------------------------
  // Description validation
  // -----------------------------
  if (description.length > 1000) {
    errors.description =
      "Description must not exceed 1,000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,

    errors,

    data: {
      title,
      category,
      level,
      duration,

      price:
        course.price === undefined ||
        course.price === null ||
        course.price === ""
          ? course.price
          : Number(course.price),

      image,
      description,
    },
  };
};


// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();

    res.status(200).json({
      message: "Courses retrieved successfully",
      courses,
    });

  } catch (error) {
    console.error("Error getting courses:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get one course
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.getById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      message: "Course retrieved successfully",
      course,
    });

  } catch (error) {
    console.error("Error getting course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Create course
const createCourse = async (req, res) => {
  try {

    // Server-side validation
    const validation = validateCourse(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const courseData = validation.data;

    // Duplicate title check
    const existingCourse = await Course.getByTitle(
      courseData.title
    );

    if (existingCourse) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title: "A course with this title already exists",
        },
      });
    }

    // Create course
    const courseId = await Course.create(courseData);

    res.status(201).json({
      message: "Course created successfully",
      courseId,
    });

  } catch (error) {
    console.error("Error creating course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Server-side validation
    const validation = validateCourse(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const courseData = validation.data;

    // Duplicate title check
    // Exclude the current course
    const duplicateCourse =
      await Course.getByTitleExcludingId(
        courseData.title,
        id
      );

    if (duplicateCourse) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title: "A course with this title already exists",
        },
      });
    }

    // Update course
    await Course.update(id, courseData);

    // Get updated course
    const updatedCourse = await Course.getById(id);

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });

  } catch (error) {
    console.error("Error updating course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    await Course.delete(id);

    res.status(200).json({
      message: "Course deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get statistics (PUBLIC)
const getStats = async (req, res) => {
  try {
    const courses = await Course.getAll();
    const studentCount = await User.countByRole("student");

    res.status(200).json({
      message: "Statistics retrieved successfully",
      courseCount: courses.length,
      studentCount: studentCount,
    });

  } catch (error) {
    console.error("Error getting statistics:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
};