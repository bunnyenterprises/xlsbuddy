import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#030712]">
        <div className="text-center max-w-md">
          <div className="overline klein mb-2">INVALID LINK</div>
          <h2 className="text-2xl font-extrabold mb-3">Reset link is missing.</h2>
          <p className="text-muted-foreground mb-6">Please request a new password reset link.</p>
          <Link to="/forgot-password">
            <Button className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-12 px-8">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#030712]">
      <div className="w-full max-w-md">
        {done ? (
          <div className="border border-foreground/15 p-8 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" weight="duotone" />
            <div className="overline klein mb-2">SUCCESS</div>
            <h2 className="text-2xl font-extrabold tracking-tight mb-3">Password updated!</h2>
            <p className="text-muted-foreground mb-6">Your password has been changed. You can now sign in with your new password.</p>
            <Button
              onClick={() => navigate("/login")}
              className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white w-full h-12"
            >
              Sign In <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <div className="overline klein mb-2">RESET PASSWORD</div>
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Choose a new password.</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="overline">NEW PASSWORD</Label>
              <Input
                id="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-none border-foreground/30 h-12 text-base"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="overline">CONFIRM PASSWORD</Label>
              <Input
                id="confirm" type="password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="rounded-none border-foreground/30 h-12 text-base"
                placeholder="Same password again"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="rounded-none w-full h-12 bg-klein hover:bg-[#002FA7]/90 text-white text-base font-bold"
            >
              {loading ? "Updating…" : "Set new password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
