-- Add new columns to line_item_budgets table
ALTER TABLE line_item_budgets 
ADD COLUMN IF NOT EXISTS quantity numeric,
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS rate numeric,
ADD COLUMN IF NOT EXISTS total numeric,
ADD COLUMN IF NOT EXISTS notes text;

-- Update existing records to set total = contract_budget where total is null
UPDATE line_item_budgets 
SET total = contract_budget 
WHERE total IS NULL;