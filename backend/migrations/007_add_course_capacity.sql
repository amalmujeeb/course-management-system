USE course_management;

-- CR-007: Course Seat Capacity and Availability
-- Add optional maximum student capacity to existing courses.
ALTER TABLE courses
ADD COLUMN max_students INT NULL;

-- Seed one small-capacity course for testing.
-- React already has one seeded enrollment, so capacity 2 leaves one seat.
UPDATE courses
SET max_students = 2
WHERE title = 'React';