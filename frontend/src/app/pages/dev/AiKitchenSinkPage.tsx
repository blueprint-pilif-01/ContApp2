import { useState } from "react";
import { AIGradientBorder, AIResultCard, AISparkleButton, AIShimmerText, AIThinkingBlob } from "../../../components/ai";
import { PageHeader } from "../../../components/ui/PageHeader";
import { summarize } from "../../../lib/mockAI";

export default function AiKitchenSinkPage() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  const run = async () => {
    setLoading(true);
    for await (const chunk of summarize("Acesta este un text demo pentru testarea componentelor AI.")) {
      setText(chunk);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Kitchen Sink" description="Preview pentru componentele vizuale AI." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIGradientBorder active={loading}>
          <div className="p-4 rounded-2xl space-y-3">
            <p className="text-sm font-medium">AIGradientBorder + AIThinkingBlob</p>
            <AIThinkingBlob />
            <AISparkleButton label="Run demo" loading={loading} onClick={run} />
          </div>
        </AIGradientBorder>

        <AIResultCard loading={loading} onRegenerate={run} onCopy={() => navigator.clipboard.writeText(text)}>
          <AIShimmerText
            active={loading}
            text={text || "Rulează demo pentru a vedea shimmer și streaming."}
            className="text-sm text-foreground"
          />
        </AIResultCard>
      </div>
    </div>
  );
}
