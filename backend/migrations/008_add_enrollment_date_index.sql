USE course_management;

-- CR-008: Support date range filtering and default enrollment date ordering.
CREATE INDEX idx_enrollments_enrolled_at ON enrollments (enrolled_at);
