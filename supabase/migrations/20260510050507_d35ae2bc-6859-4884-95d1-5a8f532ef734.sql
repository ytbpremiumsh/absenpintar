ALTER TABLE public.parent_leave_requests
  ADD CONSTRAINT parent_leave_requests_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_parent_leave_requests_school_id ON public.parent_leave_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_leave_requests_student_id ON public.parent_leave_requests(student_id);