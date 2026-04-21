-- Step 1: Add tax_rate column to articles table
-- Type is numeric to support fractional rates if needed in the future
-- Default value is set to 19 as requested

ALTER TABLE IF EXISTS articles 
ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 19;

-- Optional: Update existing entries to ensures they have the default value
UPDATE articles SET tax_rate = 19 WHERE tax_rate IS NULL;
