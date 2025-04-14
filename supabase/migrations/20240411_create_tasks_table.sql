-- Create the category enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE task_category AS ENUM ('work', 'personal', 'health', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the table if it exists and recreate it with all columns
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category task_category DEFAULT 'other' NOT NULL,
    color VARCHAR(7) DEFAULT '#FFD93D',
    due_date DATE,
    scheduled_time TIME,
    tags TEXT[] DEFAULT '{}'::TEXT[]
); 