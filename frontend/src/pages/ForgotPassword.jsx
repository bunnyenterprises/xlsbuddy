import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#030712]">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 overline text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={14} /> BACK TO SIGN IN
        </Link>

        {sent ? (
          <div className="border border-foreground/15 p-8">
            <EnvelopeSimple size={36} className="klein mb-4" weight="duotone" />
            <div className="overline klein mb-2">CHECK YOUR INBOX</div>
            <h2 className="text-2xl font-extrabold tracking-tight mb-3">Email sent!</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
              Check your spam folder if it doesn't arrive in a few minutes.
            </p>
            <Link to="/login">
              <Button className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white w-full h-12">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <div className="overline klein mb-2">FORGOT PASSWORD</div>
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2">Reset your password.</h2>
              <p className="text-muted-foreground text-sm">Enter your email and we'll send you a reset link.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="overline">EMAIL</Label>
              <Input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-foreground/30 h-12 text-base"
                placeholder="you@work.com"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="rounded-none w-full h-12 bg-klein hover:bg-[#002FA7]/90 text-white text-base font-bold"
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <div className="text-sm text-muted-foreground">
              Remembered it? <Link to="/login" className="klein font-bold underline">Sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
