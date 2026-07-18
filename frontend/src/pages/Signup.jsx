import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "@phosphor-icons/react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function Signup() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left form panel */}
      <div className="hero-bg flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1">
        <form onSubmit={submit} className="w-full max-w-md space-y-6" data-testid="signup-form">
          <div>
            <div className="overline klein mb-2">CREATE ACCOUNT</div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Create your account</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="overline">NAME</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              data-testid="signup-name-input"
              className="rounded-none border-foreground/30 h-12 text-base"
              placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="overline">EMAIL</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="signup-email-input"
              className="rounded-none border-foreground/30 h-12 text-base"
              placeholder="Email address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="overline">PASSWORD</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="signup-password-input"
              className="rounded-none border-foreground/30 h-12 text-base"
              placeholder="Password (min 6 chars)" />
          </div>
          <Button type="submit" disabled={loading}
            data-testid="signup-submit-button"
            className="rounded-none w-full h-12 bg-klein hover:bg-[#002FA7]/90 text-white text-base font-bold">
            {loading ? "Creating..." : (<>Create account <ArrowRight size={18} className="ml-2" /></>)}
          </Button>
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-foreground/15" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-foreground/15" />
          </div>

          <GoogleSignInButton
            label="signup_with"
            onCredential={async (credential) => {
              setLoading(true);
              try {
                await googleLogin(credential);
                toast.success("Account created with Google!");
                navigate("/dashboard");
              } catch (err) {
                toast.error(err.response?.data?.detail || "Google sign-up failed. Try again.");
              } finally {
                setLoading(false);
              }
            }}
          />

          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="klein font-bold" data-testid="signup-to-login">Sign in</Link>
          </div>
        </form>
      </div>

      {/* Right panel */}
      <div className="bg-klein text-white p-12 lg:p-16 hidden lg:flex flex-col justify-between order-1 lg:order-2">
        <Link to="/" className="flex items-center gap-2" data-testid="signup-brand">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
            <span className="font-black text-[#002FA7] text-sm">XB</span>
          </div>
          <span className="font-black tracking-tight whitespace-nowrap">XLSBuddy</span>
        </Link>
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Stop Googling.<br />
            Start<br />
            <span className="text-white/70">Mastering</span>.
          </h1>
          <ul className="mt-10 space-y-3 text-white/80">
            <li>✓ 60+ Excel functions explained clearly</li>
            <li>✓ AI-powered formula generator</li>
            <li>✓ Step-by-step tutorials for every level</li>
            <li>✓ Ask AI anything about Excel</li>
          </ul>
        </div>
        <div className="text-white/30 text-xs">© XLSBuddy</div>
      </div>
    </div>
  );
}
