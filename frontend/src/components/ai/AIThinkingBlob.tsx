import { motion } from "motion/react";

export function AIThinkingBlob() {
  return (
    <motion.div
      className="ai-thinking-blob"
      animate={{
        borderRadius: ["38% 62% 63% 37% / 41% 44% 56% 59%", "57% 43% 48% 52% / 37% 56% 44% 63%", "38% 62% 63% 37% / 41% 44% 56% 59%"],
        scale: [1, 1.08, 1],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      aria-label="AI generating"
      role="status"
    />
  );
}
