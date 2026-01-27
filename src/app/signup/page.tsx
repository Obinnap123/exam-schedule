"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Check, X, ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  validatePassword,
  validateEmail,
  validateName,
} from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    password: string[];
    email?: string;
    firstName?: string;
    lastName?: string;
  }>({
    password: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types

    // Real-time validation
    switch (name) {
      case "password":
        const { errors } = validatePassword(value);
        setValidationErrors((prev) => ({ ...prev, password: errors }));
        break;
      case "email":
        const emailResult = validateEmail(value);
        setValidationErrors((prev) => ({ ...prev, email: emailResult.error }));
        break;
      case "firstName":
        const firstNameResult = validateName(value);
        setValidationErrors((prev) => ({
          ...prev,
          firstName: firstNameResult.error,
        }));
        break;
      case "lastName":
        const lastNameResult = validateName(value);
        setValidationErrors((prev) => ({
          ...prev,
          lastName: lastNameResult.error,
        }));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check if there are any validation errors
    if (
      validationErrors.password.length > 0 ||
      validationErrors.email ||
      validationErrors.firstName ||
      validationErrors.lastName
    ) {
      setError("Please fix validation errors before submitting");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect directly to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.message.includes("already exists")) {
        setError(
          "An account with this email already exists. Please try logging in instead.",
        );
      } else if (err.message.includes("database")) {
        setError(
          "We're experiencing technical difficulties. Please try again later.",
        );
      } else if (err.message.includes("validation")) {
        setError(err.message);
      } else {
        setError(
          "Registration failed. Please check your information and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Column - Visual/Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-600 text-white p-12 relative overflow-hidden order-2">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100 0 C 80 100 50 100 0 0 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 mt-20">
          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/50 border border-indigo-400/30 text-indigo-100 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Join 10,000+ Students & Staff</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Start your journey with better scheduling.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Create an account to access advanced exam management tools, real-time timetable generation, and more.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-indigo-200">
          Already have an account? <Link href="/login" className="text-white underline hover:no-underline">Log in here</Link>
        </div>
      </div>

      {/* Right Column - Signup Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50 order-1 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 py-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <span className="font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">ExamScheduler</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-slate-600">
              Enter your details below to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${validationErrors.firstName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                  />
                </div>
                {validationErrors.firstName && (
                  <p className="text-red-600 text-xs flex items-center mt-1">
                    <X className="w-3 h-3 mr-1" />
                    {validationErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${validationErrors.lastName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                  />
                </div>
                {validationErrors.lastName && (
                  <p className="text-red-600 text-xs flex items-center mt-1">
                    <X className="w-3 h-3 mr-1" />
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${validationErrors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-600 text-xs flex items-center mt-1">
                  <X className="w-3 h-3 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${validationErrors.password.length > 0 && form.password ? 'border-amber-300 focus:border-amber-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {form.password && validationErrors.password.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                  Password requirements:
                </p>
                <ul className="space-y-1">
                  {validationErrors.password.map((error, index) => (
                    <li key={index} className="text-amber-700 text-sm flex items-start">
                      <div className="mt-0.5 mr-2 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      </div>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-fade-in">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            {/* Sign In Link */}
            <p className="mt-4 text-center text-sm text-slate-600 lg:hidden">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

