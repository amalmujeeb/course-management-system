const db = require("../config/db");

const Enrollment = {
  async createRequest(studentId, courseId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [courses] = await connection.execute(
        "SELECT id FROM courses WHERE id = ? FOR UPDATE", [courseId]
      );
      if (!courses.length) {
        const error = new Error("Course not found");
        error.code = "COURSE_NOT_FOUND";
        throw error;
      }
      const [existing] = await connection.execute(
        `SELECT id FROM enrollments
         WHERE student_id = ? AND course_id = ? AND status IN ('pending', 'approved') LIMIT 1`,
        [studentId, courseId]
      );
      if (existing.length) {
        const error = new Error("You already have a pending request or approved enrollment for this course");
        error.code = "ALREADY_ENROLLED";
        throw error;
      }
      const [result] = await connection.execute(
        "INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, 'pending')",
        [studentId, courseId]
      );
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, status, reviewerId, reason = "") {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [candidateRows] = await connection.execute(
        "SELECT course_id FROM enrollments WHERE id = ?", [id]
      );
      if (!candidateRows.length) {
        const error = new Error("Enrollment not found");
        error.code = "ENROLLMENT_NOT_FOUND";
        throw error;
      }
      const [courses] = await connection.execute(
        "SELECT id, max_students FROM courses WHERE id = ? FOR UPDATE", [candidateRows[0].course_id]
      );
      if (!courses.length) {
        const error = new Error("Course not found");
        error.code = "COURSE_NOT_FOUND";
        throw error;
      }
      const [rows] = await connection.execute(
        "SELECT id, status, course_id, student_id FROM enrollments WHERE id = ? FOR UPDATE", [id]
      );
      if (!rows.length) {
        const error = new Error("Enrollment not found");
        error.code = "ENROLLMENT_NOT_FOUND";
        throw error;
      }
      const enrollment = rows[0];
      if (enrollment.status !== "pending") {
        const error = new Error("Only pending requests can be reviewed");
        error.code = "INVALID_STATUS";
        throw error;
      }
      if (status === "approved") {
        // Serialize approvals for a course so the final seat cannot be allocated twice.
        const [duplicates] = await connection.execute(
          `SELECT id FROM enrollments
           WHERE student_id = ? AND course_id = ? AND status = 'approved' AND id <> ? LIMIT 1`,
          [enrollment.student_id, enrollment.course_id, id]
        );
        if (duplicates.length) {
          const error = new Error("Student already has an approved enrollment for this course");
          error.code = "ALREADY_ENROLLED";
          throw error;
        }
        const [counts] = await connection.execute(
          "SELECT COUNT(*) AS total FROM enrollments WHERE course_id = ? AND status = 'approved'",
          [enrollment.course_id]
        );
        if (courses[0].max_students !== null && Number(counts[0].total) >= Number(courses[0].max_students)) {
          const error = new Error("Course is full. No seats are available.");
          error.code = "COURSE_FULL";
          throw error;
        }
      }
      await connection.execute(
        `UPDATE enrollments SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
         decision_note = ? WHERE id = ? AND status = 'pending'`,
        [status, reviewerId, status === "rejected" ? reason : null, id]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT e.id, e.enrolled_at, e.status, e.reviewed_at, e.decision_note,
          c.id AS course_id, c.title, c.category, c.level, c.duration, c.price,
          c.image, c.description, c.max_students,
          (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'approved') AS enrolled_count,
          CASE WHEN c.max_students IS NULL THEN NULL ELSE c.max_students -
            (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'approved') END AS seats_remaining,
          CASE WHEN c.max_students IS NULL THEN FALSE WHEN
            (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'approved') >= c.max_students
            THEN TRUE ELSE FALSE END AS is_full
       FROM enrollments e JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`, [studentId]
    );
    return rows;
  },

  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT e.id, e.enrolled_at, e.status, u.id AS student_id, u.username, u.full_name
       FROM enrollments e JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ? AND e.status = 'approved' ORDER BY e.enrolled_at DESC`, [courseId]
    );
    return rows;
  },

  async getAdminPage(filters) {
    const conditions = [];
    const values = [];
    if (filters.q) {
      conditions.push("(LOCATE(?, LOWER(u.full_name)) > 0 OR LOCATE(?, LOWER(u.username)) > 0)");
      values.push(filters.q.toLowerCase(), filters.q.toLowerCase());
    }
    if (filters.courseId !== undefined) { conditions.push("e.course_id = ?"); values.push(filters.courseId); }
    if (filters.status) { conditions.push("e.status = ?"); values.push(filters.status); }
    if (filters.from) { conditions.push("e.enrolled_at >= ?"); values.push(filters.from); }
    if (filters.to) { conditions.push("e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)"); values.push(filters.to); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM enrollments e JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id ${where}`, values
    );
    const sortColumns = { date: "e.enrolled_at", student: "u.full_name", course: "c.title" };
    const direction = filters.order.toUpperCase();
    const offset = (filters.page - 1) * filters.limit;
    const [rows] = await db.execute(
      `SELECT e.id, e.enrolled_at, e.status, e.reviewed_by, e.reviewed_at, e.decision_note,
          u.id AS student_id, u.username, u.full_name,
          c.id AS course_id, c.title, c.category, c.level, c.max_students,
          (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'approved') AS enrolled_count
       FROM enrollments e JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id ${where}
       ORDER BY ${sortColumns[filters.sort]} ${direction}, e.id ${direction} LIMIT ? OFFSET ?`,
      [...values, filters.limit, offset]
    );
    return { enrollments: rows, total: Number(countRows[0].total) };
  },

  async delete(id) {
    const [result] = await db.execute("DELETE FROM enrollments WHERE id = ?", [id]);
    return result;
  },

  async deleteByStudent(id, studentId) {
    // Students may withdraw requests while pending; approved enrollments need admin removal.
    const [result] = await db.execute(
      "DELETE FROM enrollments WHERE id = ? AND student_id = ? AND status = 'pending'", [id, studentId]
    );
    return result;
  },
};

module.exports = Enrollment;
