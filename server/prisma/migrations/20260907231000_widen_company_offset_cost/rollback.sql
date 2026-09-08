-- Rollback guard: values outside DECIMAL(16,2) must be corrected or archived
-- before restoring the previous precision; no financial value is truncated.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "companies"
    WHERE "offset_cost_idr" >= 100000000000000
       OR "offset_cost_idr" <= -100000000000000
  ) THEN
    RAISE EXCEPTION
      'Cannot rollback offset_cost_idr precision while values exceed DECIMAL(16,2) range';
  END IF;
END $$;

ALTER TABLE "companies"
  ALTER COLUMN "offset_cost_idr" TYPE DECIMAL(16, 2);
