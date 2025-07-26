import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["User", "Vendor", "Admin"]).optional(),
  storeName: z.string().optional(),
  isApproved: z.boolean().optional(),
});

export default userSchema;
