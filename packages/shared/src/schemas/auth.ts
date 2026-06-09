import { z } from "zod";

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
