USE course_management;

-- Preserve historical enrollments as confirmed rows before enabling requests.
ALTER TABLE enrollments
    ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' AFTER enrolled_at,
    ADD COLUMN reviewed_by INT NULL AFTER status,
    ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by,
    ADD COLUMN decision_note TEXT NULL AFTER reviewed_at;

-- Rejected attempts may be resubmitted; application logic prevents duplicate pending/approved rows.
ALTER TABLE enrollments
    DROP INDEX student_id,
    ADD INDEX idx_enrollments_course_status (course_id, status),
    ADD INDEX idx_enrollments_student_course_status (student_id, course_id, status),
    ADD CONSTRAINT fk_enrollments_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
