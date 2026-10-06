const db = require("../config/db");

const Course = {

  // ======================================================
  // Get all courses with availability information
  // ======================================================

  async getAll() {

    const [rows] = await db.execute(
      `SELECT
          c.*,

          (
            SELECT COUNT(*)
            FROM enrollments e
            WHERE e.course_id = c.id
          ) AS enrolled_count,

          CASE
            WHEN c.max_students IS NULL THEN NULL
            ELSE c.max_students - (
              SELECT COUNT(*)
              FROM enrollments e
              WHERE e.course_id = c.id
            )
          END AS seats_remaining,

          CASE
            WHEN c.max_students IS NULL THEN FALSE
            WHEN (
              SELECT COUNT(*)
              FROM enrollments e
              WHERE e.course_id = c.id
            ) >= c.max_students THEN TRUE
            ELSE FALSE
          END AS is_full

       FROM courses c
       ORDER BY c.id`
    );

    return rows;
  },


  // ======================================================
  // Get one course with availability information
  // ======================================================

  async getById(id) {

    const [rows] = await db.execute(
      `SELECT
          c.*,

          (
            SELECT COUNT(*)
            FROM enrollments e
            WHERE e.course_id = c.id
          ) AS enrolled_count,

          CASE
            WHEN c.max_students IS NULL THEN NULL
            ELSE c.max_students - (
              SELECT COUNT(*)
              FROM enrollments e
              WHERE e.course_id = c.id
            )
          END AS seats_remaining,

          CASE
            WHEN c.max_students IS NULL THEN FALSE
            WHEN (
              SELECT COUNT(*)
              FROM enrollments e
              WHERE e.course_id = c.id
            ) >= c.max_students THEN TRUE
            ELSE FALSE
          END AS is_full

       FROM courses c
       WHERE c.id = ?`,
      [id]
    );

    return rows[0];
  },


  // ======================================================
  // Find course by title
  // ======================================================

  async getByTitle(title) {

    const [rows] = await db.execute(
      `SELECT *
       FROM courses
       WHERE title = ?
       LIMIT 1`,
      [title]
    );

    return rows[0];
  },


  // ======================================================
  // Find course by title excluding current course
  // ======================================================

  async getByTitleExcludingId(title, id) {

    const [rows] = await db.execute(
      `SELECT *
       FROM courses
       WHERE title = ?
       AND id != ?
       LIMIT 1`,
      [title, id]
    );

    return rows[0];
  },


  // ======================================================
  // Get current enrollment count for a course
  // ======================================================

  async getEnrollmentCount(courseId) {

    const [rows] = await db.execute(
      `SELECT COUNT(*) AS enrolled_count
       FROM enrollments
       WHERE course_id = ?`,
      [courseId]
    );

    return Number(rows[0].enrolled_count);
  },


  // ======================================================
  // Create course
  // ======================================================

  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const [result] = await db.execute(
      `INSERT INTO courses
       (
         title,
         category,
         level,
         duration,
         price,
         image,
         description,
         max_students
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students,
      ]
    );

    return result.insertId;
  },


  // ======================================================
  // Update course
  // ======================================================

  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const [result] = await db.execute(
      `UPDATE courses
       SET
         title = ?,
         category = ?,
         level = ?,
         duration = ?,
         price = ?,
         image = ?,
         description = ?,
         max_students = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students,
        id,
      ]
    );

    return result;
  },


  // ======================================================
  // Delete course
  // ======================================================

  async delete(id) {

    const [result] = await db.execute(
      `DELETE FROM courses
       WHERE id = ?`,
      [id]
    );

    return result;
  },

};


module.exports = Course;
