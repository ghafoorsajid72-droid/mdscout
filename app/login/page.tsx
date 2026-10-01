"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "signup" | "forgot">("login");
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              phone_number: phoneNumber,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg("Account created! Check your email for verification link.");
        setView("login");
      } else if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg("Signed in successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else if (view === "forgot") {
        // Send Email Password Reset Link / OTP
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?reset=true`,
        });
        if (error) throw error;
        setSuccessMsg("Password reset link / OTP has been sent to your email!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 relative">
        <Link
      href="/"
      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition"
      title="Close"
    >
      ✕
    </Link>

    <Link
      href="/"
      className="text-xs text-gray-500 hover:text-blue-600 mb-4 inline-block font-medium"
    >
      ← Back to Directory
    </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {view === "signup"
              ? "Create MDScout Account"
              : view === "login"
              ? "Welcome Back to MDScout"
              : "Reset Your Password"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {view === "signup"
              ? "Join as a Patient or Doctor"
              : view === "login"
              ? "Access saved doctors and clinical inquiries"
              : "Enter your registered email to receive OTP reset link"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 font-medium">
            {successMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {view === "signup" && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Jane Doe / John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Phone Number (For Contact/Inquiries)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+966 50 000 0000 / +1 800..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      role === "patient"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    👤 Patient / Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("doctor")}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      role === "doctor"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    🩺 Medical Doctor
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {view !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-600">
                  Password
                </label>
                {view === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

<button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            )}
            {loading
              ? "Signing In..."
              : view === "signup"
              ? "Create Account"
              : view === "login"
              ? "Log In"
              : "Send Recovery Email"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-600 border-t pt-4 space-y-2">
          {view === "forgot" ? (
            <button
              onClick={() => {
                setView("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              ← Back to Log In
            </button>
          ) : (
            <div>
              {view === "signup"
                ? "Already have an account?"
                : "Don't have an account yet?"}{" "}
              <button
                onClick={() => {
                  setView(view === "signup" ? "login" : "signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                {view === "signup" ? "Log In" : "Sign Up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}