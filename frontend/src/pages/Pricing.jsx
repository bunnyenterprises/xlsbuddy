import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Crown, Sparkle, ShieldCheck } from "@phosphor-icons/react";

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/config").then((r) => setConfig(r.data));
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleUpgrade = async () => {
    if (!user) { navigate("/login"); return; }
    if (!config?.razorpay_configured) {
      toast.error("Payments not yet configured by admin. Please try later.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/payments/create-order", { plan: "pro_monthly" });
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "XLSBuddy Pro",
        description: "Monthly Pro Plan",
        order_id: data.order_id,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#002FA7" },
        handler: async (res) => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
            });
            toast.success("Welcome to Pro! Reloading…");
            setTimeout(() => window.location.reload(), 1200);
          } catch (e) {
            toast.error(e.response?.data?.detail || "Verification failed");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      // eslint-disable-next-line no-undef
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not start payment");
    } finally {
      setLoading(false);
    }
  };

  const price = config?.pro_price_inr ?? 299;
  const limit = config?.free_daily_chat_limit ?? 5;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12 lg:py-16" data-testid="pricing-page">
        <div className="overline klein mb-3">PRICING</div>
        <h1 className="page-title mb-3">Simple. Honest. One plan.</h1>
        <p className="text-muted-foreground max-w-2xl mb-12">
          Start free. Upgrade when you need unlimited AI. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-foreground/15">
          {/* FREE */}
          <div className="border-r border-b border-foreground/15 p-8 lg:p-10 bg-white" data-testid="plan-free">
            <div className="overline mb-4">FREE</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="metric-title">₹0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
            <ul className="space-y-3 mb-10">
              {[
                "Browse all 65 Excel functions",
                "All 8 in-depth tutorials",
                "Visual mini-sheet examples",
                `${limit} AI chats per day`,
                "Search across functions & tutorials",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={18} weight="bold" className="klein shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="rounded-none w-full h-12 border-foreground/30"
              disabled
              data-testid="free-current-plan"
            >
              {user && !user.is_pro ? "Your current plan" : "Get started free"}
            </Button>
          </div>

          {/* PRO */}
          <div className="border-r border-b border-foreground/15 p-8 lg:p-10 bg-black text-white relative" data-testid="plan-pro">
            <div className="absolute top-0 right-0 bg-klein text-white text-xs font-bold px-4 py-1 overline">MOST POPULAR</div>
            <div className="overline mb-4 text-white/60 flex items-center gap-2"><Crown size={14} weight="fill" /> PRO</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="metric-title text-[#7AA0FF]">₹{price}</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-xs text-white/50 mb-6">Cancel anytime · INR billing · UPI, cards, netbanking</p>
            <ul className="space-y-3 mb-10">
              {[
                "Everything in Free",
                "Unlimited AI chats (Claude Sonnet 4.5)",
                "Priority response speed",
                "Save & organize chat history",
                "Early access to new features",
                "Email support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={18} weight="bold" className="text-[#7AA0FF] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {user?.is_pro ? (
              <Button disabled className="rounded-none w-full h-12 bg-white text-black" data-testid="pro-current">
                <Crown size={16} weight="fill" className="mr-2" /> You're on Pro
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={loading || !config?.razorpay_configured}
                data-testid="upgrade-button"
                className="rounded-none w-full h-12 bg-white text-black hover:bg-white/90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Opening checkout…" : (<><Sparkle size={16} weight="fill" className="mr-2" /> Upgrade to Pro</>)}
              </Button>
            )}
            {!config?.razorpay_configured && (
              <p className="text-xs text-white/50 mt-3 text-center">
                Admin hasn't configured payments yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-foreground/15">
          <div className="border-r border-b border-foreground/15 p-6 bg-secondary">
            <ShieldCheck size={28} className="klein mb-3" weight="duotone" />
            <div className="font-bold mb-1">Secure payments</div>
            <p className="text-sm text-muted-foreground">Powered by Razorpay. PCI-DSS compliant. UPI, cards, wallets.</p>
          </div>
          <div className="border-r border-b border-foreground/15 p-6 bg-white">
            <Sparkle size={28} className="klein mb-3" weight="duotone" />
            <div className="font-bold mb-1">Cancel anytime</div>
            <p className="text-sm text-muted-foreground">No long-term contracts. Stop whenever you want.</p>
          </div>
          <div className="border-r border-b border-foreground/15 p-6 bg-secondary">
            <Crown size={28} className="klein mb-3" weight="duotone" />
            <div className="font-bold mb-1">Built for power users</div>
            <p className="text-sm text-muted-foreground">From analysts to students — designed for daily Excel workflows.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
