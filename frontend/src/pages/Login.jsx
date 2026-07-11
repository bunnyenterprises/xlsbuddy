import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight } from "@phosphor-icons/react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      if (!err.response) {
        toast.error("Cannot reach server. Please start the backend first.");
      } else {
        toast.error(err.response?.data?.detail || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left blue panel — desktop only */}
      <div className="bg-klein text-white p-12 lg:p-16 hidden lg:flex flex-col justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="login-brand">
          <div className="w-7 h-7 bg-white flex items-center justify-center">
            <span className="klein font-black text-sm">X</span>
          </div>
          <span className="font-black tracking-tight">XLSBUDDY</span>
        </Link>
        <div>
          <div className="overline mb-6 text-white/70">WELCOME BACK</div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Pick up<br/>where you<br/>left off.
          </h1>
          <p className="mt-8 text-white/80 max-w-sm leading-relaxed">
            Your saved chats, recent searches, and bookmarked tutorials are waiting.
          </p>
        </div>
        <div className="overline text-white/50">001 / 002</div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 lg:p-12 min-h-screen lg:min-h-0">
        <form onSubmit={submit} className="w-full max-w-md space-y-4" data-testid="login-form">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-4">Sign in to your account.</h2>

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

          <Button
            type="submit" disabled={loading}
            data-testid="login-submit-button"
            className="rounded-none w-full h-12 bg-klein hover:bg-[#002FA7]/90 text-white text-base font-bold"
          >
            {loading ? "Signing in…" : (<>Sign in <ArrowRight size={18} className="ml-2" /></>)}
          </Button>

          <div className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="klein font-bold underline" data-testid="login-to-signup">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
