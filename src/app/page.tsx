"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordToggleIcon from "@/Components/Ui/PasswordToggleIcon";
import { validatePassword, validateEmail, validateName } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
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
    setForm(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
    
    // Real-time validation
    switch (name) {
      case 'password':
        const { errors } = validatePassword(value);
        setValidationErrors(prev => ({ ...prev, password: errors }));
        break;
      case 'email':
        const emailResult = validateEmail(value);
        setValidationErrors(prev => ({ ...prev, email: emailResult.error }));
        break;
      case 'firstName':
        const firstNameResult = validateName(value);
        setValidationErrors(prev => ({ ...prev, firstName: firstNameResult.error }));
        break;
      case 'lastName':
        const lastNameResult = validateName(value);
        setValidationErrors(prev => ({ ...prev, lastName: lastNameResult.error }));
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
    if (validationErrors.password.length > 0 || 
        validationErrors.email || 
        validationErrors.firstName || 
        validationErrors.lastName) {
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
          lastName: form.lastName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect directly to dashboard
      router.push('/dashboard');

    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.message.includes("already exists")) {
        setError("An account with this email already exists. Please try logging in instead.");
      } else if (err.message.includes("database")) {
        setError("We're experiencing technical difficulties. Please try again later.");
      } else if (err.message.includes("validation")) {
        setError(err.message);
      } else {
        setError("Registration failed. Please check your information and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-900 dark:to-blue-700 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#2563eb" />
              <text x="12" y="17" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">ES</text>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-700 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1 text-center">Join Exam Scheduler today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">First Name</label>
              <input
                name="firstName"
                type="text"
                required
                placeholder="John"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={handleChange}
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Last Name</label>
              <input
                name="lastName"
                type="text"
                required
                placeholder="Doe"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={handleChange}
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="john@example.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={handleChange}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Create a password"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <PasswordToggleIcon show={showPassword} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm your password"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <PasswordToggleIcon show={showConfirmPassword} />
              </button>
            </div>
          </div>

          {/* Password Requirements List */}
          {form.password && validationErrors.password.length > 0 && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm font-medium mb-2">Password Requirements:</p>
              <ul className="text-sm space-y-1">
                {validationErrors.password.map((error, index) => (
                  <li key={index} className="text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}