import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

export const registerSchema = z
  .object({
    // first_name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
    // last_name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
      re_password: z.string(),
  })
  .refine((data) => data.password === data.re_password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export const confirmPasswordResetSchema = z
  .object({
    new_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
      re_password: z.string(),
  })
  .refine((data) => data.new_password === data.re_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const resendActivationSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

