-- Create the category enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE task_category AS ENUM ('work', 'personal', 'health', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to the tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category task_category DEFAULT 'other' NOT NULL,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#FFD93D',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[]; 