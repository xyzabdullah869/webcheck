/*
# Create Admin Notification Triggers

## Purpose
Automatically create notifications for admins when key platform activities occur:
- New user registration (profile created)
- Payment proof submitted
- Withdrawal request created
- Instructor application submitted
- Assignment submission
- Review submitted
- Membership purchase request

## How It Works
Each trigger fires AFTER INSERT on the relevant table and inserts a notification
row for every admin/owner user. The notification type and message are specific
to each event.

## Tables Modified
- `notifications` — receives new rows from triggers (table already exists)

## New Database Objects
- Function: `notify_admins_new_user()` — fires on profiles INSERT
- Function: `notify_admins_payment_submission()` — fires on payment_submissions INSERT
- Function: `notify_admins_withdrawal_request()` — fires on withdrawal_requests INSERT
- Function: `notify_admins_instructor_application()` — fires on instructor_applications INSERT
- Function: `notify_admins_assignment_submission()` — fires on assignment_submissions INSERT
- Function: `notify_admins_review_submitted()` — fires on reviews INSERT
- Function: `notify_admins_membership_purchase()` — fires on membership_purchases INSERT
- Triggers on each table calling the corresponding function

## Security
- Functions run as SECURITY DEFINER to be able to insert into notifications table
- Triggers fire regardless of RLS since they are database-level
- No new policies needed — notifications table already has appropriate RLS

## Important Notes
1. Each function fetches admin/owner user IDs from profiles and inserts one notification per admin
2. Notifications use appropriate types: 'system', 'payment', 'wallet', etc.
3. The link field points to the relevant admin page for each notification type
4. Functions are idempotent — re-running the migration drops and recreates triggers safely
*/

-- ============================================================
-- Helper: get admin user IDs
-- ============================================================
CREATE OR REPLACE FUNCTION get_admin_user_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE role IN ('admin', 'owner');
$$;

-- ============================================================
-- 1. New User Registration Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'system', 'New User Registration',
            'New user "' || COALESCE(NEW.full_name, 'Unknown') || '" has registered.',
            '/admin/students', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_user ON profiles;
CREATE TRIGGER trg_notify_admins_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_user();

-- ============================================================
-- 2. Payment Proof Submitted Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_payment_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  user_email text;
BEGIN
  SELECT email INTO user_email FROM profiles WHERE id = NEW.user_id;
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'payment', 'Payment Proof Submitted',
            'A payment proof has been submitted by "' || COALESCE(user_email, 'Unknown user') || '".',
            '/admin/payment-submissions', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_payment_submission ON payment_submissions;
CREATE TRIGGER trg_notify_admins_payment_submission
  AFTER INSERT ON payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_payment_submission();

-- ============================================================
-- 3. Withdrawal Request Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  instructor_name text;
BEGIN
  SELECT full_name INTO instructor_name FROM profiles WHERE id = NEW.instructor_id;
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'wallet', 'Withdrawal Request',
            'A withdrawal request for PKR ' || NEW.amount || ' has been submitted by "' || COALESCE(instructor_name, 'Unknown') || '".',
            '/admin/withdrawals', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_withdrawal_request ON withdrawal_requests;
CREATE TRIGGER trg_notify_admins_withdrawal_request
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_withdrawal_request();

-- ============================================================
-- 4. Instructor Application Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_instructor_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'system', 'Instructor Application',
            'A new instructor application has been submitted by "' || COALESCE(NEW.full_name, 'Unknown') || '".',
            '/admin/instructor-applications', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_instructor_application ON instructor_applications;
CREATE TRIGGER trg_notify_admins_instructor_application
  AFTER INSERT ON instructor_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_instructor_application();

-- ============================================================
-- 5. Assignment Submission Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_assignment_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  student_name text;
  assignment_title text;
BEGIN
  SELECT full_name INTO student_name FROM profiles WHERE id = NEW.user_id;
  SELECT title INTO assignment_title FROM assignments WHERE id = NEW.assignment_id;
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'assignment', 'Assignment Submission',
            'A submission for "' || COALESCE(assignment_title, 'an assignment') || '" was made by "' || COALESCE(student_name, 'Unknown') || '".',
            '/admin/assignments', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_assignment_submission ON assignment_submissions;
CREATE TRIGGER trg_notify_admins_assignment_submission
  AFTER INSERT ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_assignment_submission();

-- ============================================================
-- 6. Review Submitted Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_review_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  reviewer_name text;
  course_title text;
BEGIN
  SELECT full_name INTO reviewer_name FROM profiles WHERE id = NEW.user_id;
  SELECT title INTO course_title FROM courses WHERE id = NEW.course_id;
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'system', 'New Review Submitted',
            'A ' || NEW.rating || '-star review was submitted for "' || COALESCE(course_title, 'a course') || '" by "' || COALESCE(reviewer_name, 'Unknown') || '".',
            '/admin/reviews', false);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_review_submitted ON reviews;
CREATE TRIGGER trg_notify_admins_review_submitted
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_review_submitted();

-- ============================================================
-- 7. Membership Purchase Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admins_membership_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  user_name text;
BEGIN
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  FOR admin_id IN SELECT id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (admin_id, 'payment', 'Membership Purchase Request',
            'A membership purchase (PKR ' || NEW.amount || ') was submitted by "' || COALESCE(user_name, 'Unknown') || '".',
            '/admin/memberships', false);
  END LOOP;
  RETURN NEW;
END;
$$;

-- Only create trigger if membership_purchases table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_purchases') THEN
    DROP TRIGGER IF EXISTS trg_notify_admins_membership_purchase ON membership_purchases;
    CREATE TRIGGER trg_notify_admins_membership_purchase
      AFTER INSERT ON membership_purchases
      FOR EACH ROW
      EXECUTE FUNCTION notify_admins_membership_purchase();
  END IF;
END;
$$;

-- ============================================================
-- 8. Quiz Submission Notification (to student)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_student_quiz_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, read)
  VALUES (NEW.user_id, 'quiz',
          'Quiz ' || CASE WHEN NEW.passed THEN 'Passed' ELSE 'Completed' END,
          'Your quiz score: ' || NEW.score || '%',
          '/dashboard/quizzes', false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_student_quiz_result ON quiz_results;
CREATE TRIGGER trg_notify_student_quiz_result
  AFTER INSERT ON quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_quiz_result();
