-- Create the category enum type if it doesn't exist
CREATE TYPE task_category AS ENUM ('work', 'personal', 'health', 'other');

-- Add the category column to the tasks table
ALTER TABLE tasks 
ADD COLUMN category task_category DEFAULT 'other' NOT NULL; 