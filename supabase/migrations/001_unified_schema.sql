-- ============================================================================
-- Unified Supabase Schema for Proultima Project Management Platform
-- Merges user-provided schema with existing schema features
-- ============================================================================

-- Enable UUID generation (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROJECTS TABLE (Master)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_number text NOT NULL,
  project_name text NOT NULL,
  client_name text NOT NULL DEFAULT 'PSG'::text,
  contractor_name text NOT NULL DEFAULT 'TBD'::text,
  project_location text NOT NULL DEFAULT 'TBD'::text,
  estimated_tons numeric DEFAULT 0,
  detailed_tons_per_approval numeric DEFAULT 0,
  detailed_tons_per_latest_rev numeric DEFAULT 0,
  released_tons numeric DEFAULT 0,
  detailing_status text NOT NULL DEFAULT 'IN PROCESS'::text,
  revision_status text NOT NULL DEFAULT 'IN PROCESS'::text,
  release_status text NOT NULL DEFAULT 'IN PROCESS'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'completed'::text, 'cancelled'::text])),
  due_date date,
  start_date date,
  actual_delivery_date date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_project_number_unique UNIQUE (project_number)
);

CREATE INDEX IF NOT EXISTS projects_project_number_idx ON public.projects(project_number);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);

-- RLS Policies for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all"
  ON public.projects FOR SELECT
  USING (true); -- Allow all authenticated users to view projects

DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
CREATE POLICY "projects_insert_authenticated"
  ON public.projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
CREATE POLICY "projects_update_authenticated"
  ON public.projects FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- DRAWING_LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.drawing_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  dwg text NOT NULL,
  status text NOT NULL,
  description text,
  release_status text DEFAULT ''::text,
  latest_submitted_date text,
  weeks_since_sent text DEFAULT ''::text,
  total_weight numeric DEFAULT 0,
  pdf_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drawing_log_pkey PRIMARY KEY (id),
  CONSTRAINT drawing_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS drawing_log_project_id_idx ON public.drawing_log(project_id);
CREATE INDEX IF NOT EXISTS drawing_log_dwg_idx ON public.drawing_log(dwg);
CREATE INDEX IF NOT EXISTS drawing_log_status_idx ON public.drawing_log(status);

ALTER TABLE public.drawing_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drawing_log_select_all" ON public.drawing_log;
CREATE POLICY "drawing_log_select_all"
  ON public.drawing_log FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "drawing_log_modify_authenticated" ON public.drawing_log;
CREATE POLICY "drawing_log_modify_authenticated"
  ON public.drawing_log FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- DRAWINGS_YET_TO_RELEASE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.drawings_yet_to_release (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  dwg text NOT NULL,
  status text NOT NULL DEFAULT 'FFU'::text CHECK (status = 'FFU'::text),
  description text,
  release_status text DEFAULT ''::text,
  latest_submitted_date text,
  weeks_since_sent text DEFAULT ''::text,
  total_weight numeric DEFAULT 0,
  pdf_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drawings_yet_to_release_pkey PRIMARY KEY (id),
  CONSTRAINT drawings_yet_to_release_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS drawings_yet_to_release_project_id_idx ON public.drawings_yet_to_release(project_id);
CREATE INDEX IF NOT EXISTS drawings_yet_to_release_dwg_idx ON public.drawings_yet_to_release(dwg);

ALTER TABLE public.drawings_yet_to_release ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drawings_yet_to_release_select_all" ON public.drawings_yet_to_release;
CREATE POLICY "drawings_yet_to_release_select_all"
  ON public.drawings_yet_to_release FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "drawings_yet_to_release_modify_authenticated" ON public.drawings_yet_to_release;
CREATE POLICY "drawings_yet_to_release_modify_authenticated"
  ON public.drawings_yet_to_release FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- DRAWINGS_YET_TO_RETURN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.drawings_yet_to_return (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  dwg text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['APP'::text, 'R&R'::text])),
  description text,
  release_status text DEFAULT ''::text,
  latest_submitted_date text,
  weeks_since_sent text DEFAULT ''::text,
  total_weight numeric DEFAULT 0,
  pdf_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drawings_yet_to_return_pkey PRIMARY KEY (id),
  CONSTRAINT drawings_yet_to_return_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS drawings_yet_to_return_project_id_idx ON public.drawings_yet_to_return(project_id);
CREATE INDEX IF NOT EXISTS drawings_yet_to_return_dwg_idx ON public.drawings_yet_to_return(dwg);

ALTER TABLE public.drawings_yet_to_return ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drawings_yet_to_return_select_all" ON public.drawings_yet_to_return;
CREATE POLICY "drawings_yet_to_return_select_all"
  ON public.drawings_yet_to_return FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "drawings_yet_to_return_modify_authenticated" ON public.drawings_yet_to_return;
CREATE POLICY "drawings_yet_to_return_modify_authenticated"
  ON public.drawings_yet_to_return FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id text NOT NULL,
  project_number text NOT NULL,
  project_name text NOT NULL,
  billed_tonnage numeric DEFAULT 0,
  unit_price_lump_sum numeric DEFAULT 0,
  tons_billed_amount numeric DEFAULT 0,
  billed_hours_co numeric DEFAULT 0,
  co_price numeric DEFAULT 0,
  co_billed_amount numeric DEFAULT 0,
  total_amount_billed numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft'::text CHECK (status = ANY (ARRAY['Paid'::text, 'Pending'::text, 'Overdue'::text, 'Draft'::text, 'Cancelled'::text])),
  paid_date timestamp with time zone,
  issue_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_invoice_id_unique UNIQUE (invoice_id)
);

CREATE INDEX IF NOT EXISTS invoices_project_number_idx ON public.invoices(project_number);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON public.invoices(issue_date);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_all" ON public.invoices;
CREATE POLICY "invoices_select_all"
  ON public.invoices FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "invoices_modify_authenticated" ON public.invoices;
CREATE POLICY "invoices_modify_authenticated"
  ON public.invoices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  razorpay_payment_id text NOT NULL UNIQUE,
  razorpay_order_id text NOT NULL,
  razorpay_signature text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR'::text,
  payment_method text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text])),
  razorpay_response jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_razorpay_payment_id_idx ON public.payments(razorpay_payment_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
CREATE POLICY "payments_select_all"
  ON public.payments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "payments_modify_authenticated" ON public.payments;
CREATE POLICY "payments_modify_authenticated"
  ON public.payments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  drawing_id uuid,
  submission_type text NOT NULL CHECK (submission_type = ANY (ARRAY['APP'::text, 'R&R'::text, 'FFU'::text, 'PENDING'::text, 'RFI'::text, 'SUBMITTAL'::text])),
  work_description text,
  drawing_number text,
  sheets text,
  submission_date date NOT NULL,
  release_status text,
  pdf_path text,
  status text,
  evaluation_date date,
  submitted_by text,
  evaluated_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS submissions_project_id_idx ON public.submissions(project_id);
CREATE INDEX IF NOT EXISTS submissions_submission_type_idx ON public.submissions(submission_type);
CREATE INDEX IF NOT EXISTS submissions_submission_date_idx ON public.submissions(submission_date);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select_all" ON public.submissions;
CREATE POLICY "submissions_select_all"
  ON public.submissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "submissions_modify_authenticated" ON public.submissions;
CREATE POLICY "submissions_modify_authenticated"
  ON public.submissions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- MATERIAL LISTS TABLE (from existing schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  heading text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_lists_project_idx ON public.material_lists(project_id);

ALTER TABLE public.material_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_lists_select_all" ON public.material_lists;
CREATE POLICY "material_lists_select_all"
  ON public.material_lists FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "material_lists_modify_authenticated" ON public.material_lists;
CREATE POLICY "material_lists_modify_authenticated"
  ON public.material_lists FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- MATERIAL LIST BAR ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_list_bar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_list_id uuid NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  dwg_no text,
  release_description text,
  ctrl_code text,
  rel_no text,
  weight_lbs numeric,
  date date,
  varying_bars text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_list_bar_items_list_idx ON public.material_list_bar_items(material_list_id);

ALTER TABLE public.material_list_bar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ml_bar_items_select_all" ON public.material_list_bar_items;
CREATE POLICY "ml_bar_items_select_all"
  ON public.material_list_bar_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "ml_bar_items_modify_authenticated" ON public.material_list_bar_items;
CREATE POLICY "ml_bar_items_modify_authenticated"
  ON public.material_list_bar_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- MATERIAL LIST FIELDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_list_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_list_id uuid NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_list_fields_list_idx ON public.material_list_fields(material_list_id);

ALTER TABLE public.material_list_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ml_fields_select_all" ON public.material_list_fields;
CREATE POLICY "ml_fields_select_all"
  ON public.material_list_fields FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "ml_fields_modify_authenticated" ON public.material_list_fields;
CREATE POLICY "ml_fields_modify_authenticated"
  ON public.material_list_fields FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- CHAT MESSAGES TABLE (optional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  role text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_project_idx ON public.chat_messages(project_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;
CREATE POLICY "chat_messages_select_own"
  ON public.chat_messages FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own"
  ON public.chat_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drawing_log_updated_at ON public.drawing_log;
CREATE TRIGGER update_drawing_log_updated_at BEFORE UPDATE ON public.drawing_log
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drawings_yet_to_release_updated_at ON public.drawings_yet_to_release;
CREATE TRIGGER update_drawings_yet_to_release_updated_at BEFORE UPDATE ON public.drawings_yet_to_release
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drawings_yet_to_return_updated_at ON public.drawings_yet_to_return;
CREATE TRIGGER update_drawings_yet_to_return_updated_at BEFORE UPDATE ON public.drawings_yet_to_return
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.projects IS 'Master table for all construction projects';
COMMENT ON TABLE public.drawing_log IS 'Complete log of all drawings';
COMMENT ON TABLE public.drawings_yet_to_release IS 'Drawings with FFU status waiting to be released';
COMMENT ON TABLE public.drawings_yet_to_return IS 'Drawings with APP or R&R status waiting for return';
COMMENT ON TABLE public.invoices IS 'Project invoices and billing information';
COMMENT ON TABLE public.payments IS 'Payment records linked to invoices via Razorpay';
COMMENT ON TABLE public.submissions IS 'Drawing submissions, RFIs, and submittals';

