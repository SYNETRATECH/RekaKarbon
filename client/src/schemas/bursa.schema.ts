import { z } from 'zod';
import { UuidSchema, IdrAmountSchema, CarbonVolumeSchema, PercentageSchema } from './common.schema';

export const BursaCategorySchema = z.enum(['mangrove', 'hutan', 'gambut']);

export const BursaItemSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  verified: z.boolean(),
  category: BursaCategorySchema,
  categoryLabel: z.string().min(1),
  location: z.string().min(1),
  priceFraction: IdrAmountSchema,
  change24h: z.number(),
  supplyFractions: CarbonVolumeSchema,
  supplyPercent: PercentageSchema,
});

export type BursaCategoryType = z.infer<typeof BursaCategorySchema>;
export type BursaItemType = z.infer<typeof BursaItemSchema>;
