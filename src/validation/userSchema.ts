import { z } from "zod";

const userSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["User", "Vendor", "Admin"]).optional().default("User"),
    storeName: z.string().optional(),
    isApproved: z.boolean().optional(),
    removeImage: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "Vendor" && !data.storeName) {
      ctx.addIssue({
        path: ["storeName"],
        code: z.ZodIssueCode.custom,
        message: "storeName is required for Vendors",
      });
    }

    if (data.role !== "Vendor" && data.storeName) {
      ctx.addIssue({
        path: ["storeName"],
        code: z.ZodIssueCode.custom,
        message: "Only vendors can provide a storeName",
      });
    }

    if (data.role !== "Vendor" && typeof data.isApproved !== "undefined") {
      ctx.addIssue({
        path: ["isApproved"],
        code: z.ZodIssueCode.custom,
        message: "isApproved is only relevant for Vendors",
      });
    }
  });

export default userSchema;
