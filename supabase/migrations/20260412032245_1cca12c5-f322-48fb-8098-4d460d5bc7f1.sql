
-- Table for ID card designs
CREATE TABLE public.id_card_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  preview_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.id_card_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active designs" ON public.id_card_designs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins manage designs" ON public.id_card_designs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Table for ID card orders
CREATE TABLE public.id_card_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  design_id uuid REFERENCES public.id_card_designs(id),
  total_cards integer NOT NULL DEFAULT 0,
  price_per_card integer NOT NULL DEFAULT 7000,
  total_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  progress text NOT NULL DEFAULT 'waiting_payment',
  payment_transaction_id uuid REFERENCES public.payment_transactions(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.id_card_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School users view own orders" ON public.id_card_orders
  FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "School users create orders" ON public.id_card_orders
  FOR INSERT TO authenticated
  WITH CHECK (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Super admins manage all orders" ON public.id_card_orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Table for order items (which students)
CREATE TABLE public.id_card_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.id_card_orders(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_class text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.id_card_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School users view own order items" ON public.id_card_order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.id_card_orders WHERE school_id = get_user_school_id(auth.uid())));

CREATE POLICY "School users create order items" ON public.id_card_order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.id_card_orders WHERE school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Super admins manage all order items" ON public.id_card_order_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_id_card_orders_updated_at
  BEFORE UPDATE ON public.id_card_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
