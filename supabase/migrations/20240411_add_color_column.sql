-- Add the color column to the tasks table
ALTER TABLE tasks 
ADD COLUMN color VARCHAR(7) DEFAULT '#FFD93D'; 