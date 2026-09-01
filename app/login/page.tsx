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