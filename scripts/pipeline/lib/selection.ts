import * as v from 'valibot';
import { RARITIES } from '@musee/rules';

export const SelectionEntrySchema = v.object({
  painterId: v.string(),
  museum: v.literal('aic'),
  objectId: v.pipe(v.string(), v.regex(/^\d+$/)),
  title: v.optional(v.string()),
  date: v.optional(v.string()),
  titleFr: v.optional(v.string()),
  genre: v.string(),
  rarity: v.optional(v.picklist(RARITIES))
});

export const SelectionSchema = v.array(SelectionEntrySchema);
