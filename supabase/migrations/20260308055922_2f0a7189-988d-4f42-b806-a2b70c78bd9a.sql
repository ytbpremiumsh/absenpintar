-- Allow authenticated users to DELETE pickup_logs for their school
CREATE POLICY "Staff delete pickup logs"
ON public.pickup_logs
FOR DELETE
TO authenticated
USING (school_id = get_user_school_id(auth.uid()));

-- Allow authenticated users to UPDATE pickup_logs for their school
CREATE POLICY "Staff update pickup logs"
ON public.pickup_logs
FOR UPDATE
TO authenticated
USING (school_id = get_user_school_id(auth.uid()));
