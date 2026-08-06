/*
# Course Cascade Delete Function

## Purpose
Provides a secure, server-side function to delete a course and ALL related child records.
Only the course owner (instructor), admin, or owner can delete a course.

## What It Deletes (in dependency order)
1. lesson_progress, quiz_results, quiz_questions, quizzes
2. assignment_submissions, assignments
3. lessons, modules
4. bookmarks, reviews, certificates
5. enrollments, order_items, instructor_earnings
6. course_files, courses

## Security
- SECURITY DEFINER — can delete across tables regardless of RLS
- Permission check: caller must be course instructor OR admin/owner
- Uses auth.uid() for identity verification

## Parameters
- p_course_id (uuid): The course to delete

## Returns
- JSON with success boolean and message
*/

CREATE OR REPLACE FUNCTION delete_course_cascade(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course record;
  v_caller_id uuid := auth.uid();
  v_caller_role text;
BEGIN
  SELECT * INTO v_course FROM courses WHERE id = p_course_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course not found');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF v_course.instructor_id IS DISTINCT FROM v_caller_id
     AND v_caller_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- Delete child records in dependency order
  DELETE FROM lesson_progress
  WHERE lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = p_course_id
  );

  DELETE FROM quiz_results
  WHERE quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN modules m ON q.module_id = m.id
    WHERE m.course_id = p_course_id
  );

  DELETE FROM quiz_questions
  WHERE quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN modules m ON q.module_id = m.id
    WHERE m.course_id = p_course_id
  );

  DELETE FROM quizzes
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);

  DELETE FROM assignment_submissions
  WHERE assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN modules m ON a.module_id = m.id
    WHERE m.course_id = p_course_id
  );

  DELETE FROM assignments
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);

  DELETE FROM lessons
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);

  DELETE FROM modules WHERE course_id = p_course_id;

  DELETE FROM bookmarks WHERE course_id = p_course_id;
  DELETE FROM reviews WHERE course_id = p_course_id;
  DELETE FROM certificates WHERE course_id = p_course_id;
  DELETE FROM enrollments WHERE course_id = p_course_id;
  DELETE FROM order_items WHERE course_id = p_course_id;
  DELETE FROM instructor_earnings WHERE course_id = p_course_id;
  DELETE FROM course_files WHERE course_id = p_course_id;

  DELETE FROM courses WHERE id = p_course_id;

  RETURN jsonb_build_object('success', true, 'message', 'Course and all related data deleted');
END;
$$;

GRANT EXECUTE ON FUNCTION delete_course_cascade(uuid) TO authenticated;
