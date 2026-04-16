-- Create todos table with app prefix
CREATE TABLE IF NOT EXISTS app_06d0_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_06d0_todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own todos" ON app_06d0_todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON app_06d0_todos;
DROP POLICY IF EXISTS "Users can update own todos" ON app_06d0_todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON app_06d0_todos;

-- Create RLS policies
CREATE POLICY "Users can view own todos"
    ON app_06d0_todos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
    ON app_06d0_todos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
    ON app_06d0_todos
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
    ON app_06d0_todos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_06d0_todos_user_id ON app_06d0_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_app_06d0_todos_is_completed ON app_06d0_todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_app_06d0_todos_created_at ON app_06d0_todos(created_at);

-- Add to realtime publication for live updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_06d0_todos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_06d0_todos;
    END IF;
END $$;

-- Create storage bucket for potential file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_06d0_attachments', 'app_06d0_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Users can upload own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own attachments" ON storage.objects;

CREATE POLICY "Users can upload own attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'app_06d0_attachments' 
        AND (auth.uid()::text = (storage.foldername(name))[1])
    );

CREATE POLICY "Users can update own attachments"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'app_06d0_attachments' 
        AND (auth.uid()::text = (storage.foldername(name))[1])
    );

CREATE POLICY "Users can delete own attachments"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'app_06d0_attachments' 
        AND (auth.uid()::text = (storage.foldername(name))[1])
    );

CREATE POLICY "Users can view own attachments"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'app_06d0_attachments' 
        AND (auth.uid()::text = (storage.foldername(name))[1])
    );