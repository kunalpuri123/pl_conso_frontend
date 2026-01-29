-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sites table (linked to projects)
CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

-- Create run_status enum
CREATE TYPE public.run_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Create runs table for automation executions
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_uuid TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    scope TEXT,
    crawl_filename TEXT,
    master_filename TEXT,
    status run_status NOT NULL DEFAULT 'pending',
    progress_percent INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create run_logs table for real-time log streaming
CREATE TABLE public.run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL
);

-- Create run_files table for output files
CREATE TABLE public.run_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
    file_type TEXT NOT NULL, -- OUTPUT, LOG, COMPLIANCE, etc.
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create input_files table for admin-managed files
CREATE TABLE public.input_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- CRAWL, MASTER
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.input_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies (only admins can modify roles)
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Projects policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage projects"
    ON public.projects FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Sites policies
CREATE POLICY "Authenticated users can view sites"
    ON public.sites FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage sites"
    ON public.sites FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Runs policies
CREATE POLICY "Users can view their own runs"
    ON public.runs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view team runs"
    ON public.runs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create runs"
    ON public.runs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
    ON public.runs FOR UPDATE
    USING (auth.uid() = user_id);

-- Run logs policies
CREATE POLICY "Users can view logs for their runs"
    ON public.run_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            WHERE runs.id = run_logs.run_id
        )
    );

CREATE POLICY "Authenticated users can insert logs"
    ON public.run_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Run files policies
CREATE POLICY "Users can view files for accessible runs"
    ON public.run_files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert run files"
    ON public.run_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Input files policies
CREATE POLICY "Authenticated users can view input files"
    ON public.input_files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage input files"
    ON public.input_files FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Audit log policies
CREATE POLICY "Admins can view audit log"
    ON public.audit_log FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_log FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
    ON public.feedback FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit feedback"
    ON public.feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Default role is 'user'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for runs and run_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_logs;

-- Insert initial projects
INSERT INTO public.projects (name, description) VALUES
    ('LVMH', 'LVMH Project'),
    ('COTY', 'COTY Project'),
    ('Hermes', 'Hermes Project');

-- Insert initial sites for LVMH
INSERT INTO public.sites (project_id, name)
SELECT id, site_name
FROM public.projects, 
    (VALUES ('UK'), ('DE'), ('FR'), ('US'), ('Canada')) AS sites(site_name)
WHERE projects.name = 'LVMH';