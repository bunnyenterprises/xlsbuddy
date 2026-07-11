import React, { useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkle, Copy, Check } from "@phosphor-icons/react";

const EXAMPLES = [
  "Sum sales only for London",
  "Find product name from a price list using product ID",
  "Count cells where value is greater than 100",
  "Average of last 30 rows",
  "Check if a cell contains the word 'urgent'",
  "Extract the first name from a full name in column A",
];

export default function FormulaGenerator() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (text) => {
    const desc = (text ?? description).trim();
    if (!desc) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/formula/generate", { description: desc });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate formula");
    } finally {
      setLoading(false);
    }
  };

  const copyFormula = () => {
    if (!result?.formula) return;
    navigator.clipboard.writeText(result.formula);
    setCopied(true);
    toast.success("Formula copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[860px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <div className="overline klein mb-3">AI FORMULA GENERATOR</div>
        <h1 className="page-title mb-3">
          Describe it. Get the formula.
        </h1>
        <p className="text-muted-foreground max-w-xl mb-10">
          Tell XLSBuddy what you want to calculate in plain English — it'll give you the exact Excel formula.
        </p>

        <div className="border border-foreground/15 p-6 bg-white mb-8">
          <Textarea
            placeholder="e.g. Sum sales only for London..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            className="rounded-none border-foreground/30 min-h-[80px] resize-none mb-4 text-base"
          />
          <Button
            onClick={() => generate()}
            disabled={loading || !description.trim()}
            className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-12 px-8"
          >
            <Sparkle size={16} className="mr-2" weight="fill" />
            {loading ? "Generating…" : "Generate Formula"}
          </Button>
        </div>

        {result && (
          <div className="border border-foreground/15 bg-white mb-10">
            <div className="border-b border-foreground/15 px-6 py-4 flex items-center justify-between">
              <div className="overline klein">YOUR FORMULA</div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyFormula}
                className="rounded-none border-foreground/20 gap-2"
              >
                {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-secondary border border-foreground/10 px-4 py-3 font-mono text-lg font-bold tracking-tight mb-5">
                {result.formula}
              </div>
              <p className="text-sm leading-relaxed mb-4">{result.explanation}</p>
              {result.example && (
                <div>
                  <div className="overline text-muted-foreground mb-2">EXAMPLE</div>
                  <div className="bg-secondary border border-foreground/10 px-4 py-2 font-mono text-sm">
                    {result.example}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="overline text-muted-foreground mb-4">TRY THESE</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setDescription(ex); generate(ex); }}
                className="text-left text-sm border border-foreground/15 p-3 hover:border-klein hover:bg-secondary transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
