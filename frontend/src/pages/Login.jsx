import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "@phosphor-icons/react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function Login() {
  const { login, googleLogin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel */}
      <div className="bg-klein text-white p-12 lg:p-16 hidden lg:flex flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline" data-testid="login-brand">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
            <span className="font-black text-[#002FA7] text-sm">XB</span>
          </div>
          <span className="font-black tracking-tight whitespace-nowrap">XLSBuddy</span>
        </Link>
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Pick up where you left off.
          </h1>
          <p className="mt-8 text-white/80 max-w-sm leading-relaxed">
            Your formulas, your progress — all waiting for you.
          </p>
        </div>
        <div className="text-white/30 text-xs">© XLSBuddy</div>
      </div>

      {/* Right form panel */}
      <div className="hero-bg flex items-center justify-center p-6 lg:p-12 min-h-screen lg:min-h-0">
        <form onSubmit={submit} className="w-full max-w-md space-y-4" data-testid="login-form">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-4">
            Sign in to your account
          </h2>

          <Input
            id="email" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            data-testid="login-email-input"
            className="rounded-none border-foreground/30 h-12 text-base"
            placeholder="Email address"
          />

          <div>
            <Input
              id="password" type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password-input"
              className="rounded-none border-foreground/30 h-12 text-base"
              placeholder="Password"
            />
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-sm klein font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit" disabled={loading}
            data-testid="login-submit-button"
            className="rounded-none w-full h-12 bg-klein hover:bg-[#002FA7]/90 text-white text-base font-bold"
          >
            {loading ? "Signing in..." : (<>Sign in <ArrowRight size={18} className="ml-2" /></>)}
          </Button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-foreground/15" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-foreground/15" />
          </div>

          <GoogleSignInButton
            label="signin_with"
            onCredential={async (credential) => {
              setError("");
              setLoading(true);
              try {
                await googleLogin(credential);
                navigate("/dashboard", { replace: true });
              } catch (err) {
                setError(err.response?.data?.detail || "Google sign-in failed. Try again.");
              } finally {
                setLoading(false);
              }
            }}
          />

          <div className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="klein font-bold" data-testid="login-to-signup">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
