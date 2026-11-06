const db = require("../config/db");

const Report = {
  async getOverview() {
    const [totalsRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM courses) AS total_courses,
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'approved') AS total_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'pending') AS pending_enrollments,
        (SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE status = 'approved') AS students_with_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'approved' AND enrolled_at >= CURRENT_TIMESTAMP - INTERVAL 30 DAY) AS enrollments_last_30_days,
        (SELECT COUNT(*) FROM courses c WHERE NOT EXISTS (
          SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.status = 'approved'
        )) AS courses_without_enrollments
    `);

    const [[categoryRows], [topCourseRows], [recentEnrollmentRows]] = await Promise.all([
      db.execute(`
        SELECT c.category, COUNT(e.id) AS enrollment_count
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'approved'
        GROUP BY c.category
        ORDER BY enrollment_count DESC, c.category ASC
      `),
      db.execute(`
        SELECT c.id AS course_id, c.title, c.category, COUNT(e.id) AS enrollment_count
        FROM courses c
        JOIN enrollments e ON e.course_id = c.id AND e.status = 'approved'
        GROUP BY c.id, c.title, c.category
        ORDER BY enrollment_count DESC, c.title ASC, c.id ASC
        LIMIT 5
      `),
      db.execute(`
        SELECT e.id, e.enrolled_at, u.full_name, u.username,
               c.title, c.category, c.level
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        JOIN courses c ON c.id = e.course_id
        WHERE e.status = 'approved'
        ORDER BY e.enrolled_at DESC, e.id DESC
        LIMIT 6
      `),
    ]);

    const totals = totalsRows[0];
    return {
      totalCourses: Number(totals.total_courses),
      totalStudents: Number(totals.total_students),
      totalEnrollments: Number(totals.total_enrollments),
      pendingEnrollments: Number(totals.pending_enrollments),
      studentsWithEnrollments: Number(totals.students_with_enrollments),
      enrollmentsLast30Days: Number(totals.enrollments_last_30_days),
      coursesWithoutEnrollments: Number(totals.courses_without_enrollments),
      enrollmentsByCategory: categoryRows.map((row) => ({
        category: row.category,
        enrollmentCount: Number(row.enrollment_count),
      })),
      topCourses: topCourseRows.map((row) => ({
        courseId: Number(row.course_id),
        title: row.title,
        category: row.category,
        enrollmentCount: Number(row.enrollment_count),
      })),
      recentEnrollments: recentEnrollmentRows,
    };
  },

  async getStudentReport(studentId) {
    const [[summaryRows], [recentEnrollmentRows]] = await Promise.all([
      db.execute(`
        SELECT COUNT(DISTINCT CASE WHEN e.status = 'approved' THEN e.course_id END) AS enrolled_courses,
               COUNT(CASE WHEN e.status = 'pending' THEN 1 END) AS pending_enrollments,
               COUNT(DISTINCT CASE WHEN e.status = 'approved' THEN c.category END) AS distinct_categories,
               MIN(CASE WHEN e.status = 'approved' THEN e.enrolled_at END) AS earliest_enrollment,
               MAX(CASE WHEN e.status = 'approved' THEN e.enrolled_at END) AS latest_enrollment
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
      `, [studentId]),
      db.execute(`
        SELECT e.id, e.course_id, e.enrolled_at, e.status, e.reviewed_at, e.decision_note,
               c.title, c.category, c.level
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC, e.id DESC
        LIMIT 5
      `, [studentId]),
    ]);

    const summary = summaryRows[0];
    return {
      enrolledCourses: Number(summary.enrolled_courses),
      pendingEnrollments: Number(summary.pending_enrollments),
      distinctCategories: Number(summary.distinct_categories),
      earliestEnrollment: summary.earliest_enrollment,
      latestEnrollment: summary.latest_enrollment,
      recentEnrollments: recentEnrollmentRows,
    };
  },
};

module.exports = Report;
