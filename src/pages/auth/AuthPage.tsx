import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser, registerUser } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

// --- Zod Schemas ---
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName:  z.string().min(1, "Required"),
  email:     z.string().email("Invalid email"),
  password:  z.string().min(6, "Minimum 6 characters"),
  phone:     z.string().optional(),
});

type LoginForm    = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// --- Reusable Field component ---
function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  "rounded-lg bg-gray-100 px-3 py-2.5 text-sm outline-none ring-1 ring-gray-200 " +
  "focus:ring-brand-500 placeholder:text-gray-400 transition-all";

// --- Login Form ---
function LoginForm() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError("");
      const res = await loginUser(data);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? "Login failed");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Login</h2>
      <p className="mb-5 text-xs text-gray-400">
        POST /auth/login — returns a JWT token stored client-side
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            placeholder="sujal@tejovex.com"
            className={inputCls}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold
                     text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? "Logging in…" : "Login →"}
        </button>
      </form>
    </div>
  );
}

// --- Register Form ---
function RegisterForm() {
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setServerError("");
      await registerUser(data);
      setSuccessMsg("Account created! You can now log in.");
      reset();
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? "Registration failed");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Register</h2>
      <p className="mb-5 text-xs text-gray-400">
        POST /auth/register — creates a new user account
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.firstName?.message}>
            <input
              {...register("firstName")}
              placeholder="Sujal"
              className={inputCls}
            />
          </Field>
          <Field label="Last Name" error={errors.lastName?.message}>
            <input
              {...register("lastName")}
              placeholder="Das"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            placeholder="sujal@tejovex.com"
            className={inputCls}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        <Field label="Phone (optional)" error={errors.phone?.message}>
          <input
            {...register("phone")}
            placeholder="+91 98765 43210"
            className={inputCls}
          />
        </Field>

        <Field label="Role">
          <input
            value="Assigned via roleId from Role table"
            disabled
            className={`${inputCls} cursor-not-allowed text-gray-400`}
          />
        </Field>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {serverError}
          </p>
        )}
        {successMsg && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 rounded-lg border border-brand-600 py-2.5 text-sm
                     font-semibold text-brand-700 hover:bg-brand-50
                     disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? "Registering…" : "Register Account"}
        </button>
      </form>
    </div>
  );
}

// --- Main Auth Page (combines both) ---
export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Auth &amp; Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Login, Register, and current user profile endpoints.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["POST /auth/register", "POST /auth/login", "GET /auth/me"].map((e) => (
            <span
              key={e}
              className="rounded-md bg-gray-200 px-2.5 py-1 font-mono text-[11px] text-gray-600"
            >
              {e}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RegisterForm />
        <LoginForm />
      </div>
    </div>
  );
}