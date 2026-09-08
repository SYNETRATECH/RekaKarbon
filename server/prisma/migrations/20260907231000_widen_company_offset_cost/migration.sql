-- Widen the compliance cost projection so Bursa settlements cannot overflow
-- when a large remaining emissions deficit is multiplied by the RKB price.
ALTER TABLE "companies"
  ALTER COLUMN "offset_cost_idr" TYPE DECIMAL(20, 2);
