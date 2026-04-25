import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";
import { PlanBadge } from "./Badge";

interface GatingModalProps {
  open: boolean;
  onClose: () => void;
  /** Human-readable feature label, e.g. "Dosarul clientului" */
  featureLabel: string;
  /** Why it's gated: what plan has it */
  requiredPlan?: string;
  /** Custom reason message */
  reason?: string;
}

export function GatingModal({
  open,
  onClose,
  featureLabel,
  requiredPlan,
  reason,
}: GatingModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate("/app/settings?tab=subscription");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>

        <h2 className="text-base font-semibold text-foreground">
          Funcție indisponibilă
        </h2>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          {reason ?? (
            <>
              <span className="font-medium text-foreground">{featureLabel}</span>{" "}
              nu este disponibil pe planul tău curent.
              {requiredPlan && (
                <>
                  {" "}Disponibil începând cu{" "}
                  <PlanBadge plan={requiredPlan} />.
                </>
              )}
            </>
          )}
        </p>
      </div>

      <ModalFooter className="mt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Renunță
        </Button>
        <Button variant="primary" size="sm" onClick={handleUpgrade}>
          Gestionează abonamentul
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/** Hook + state for easy gating checks */
import { useState } from "react";

export function useGatingModal() {
  const [state, setState] = useState<{
    open: boolean;
    featureLabel: string;
    requiredPlan: string | undefined;
    reason: string | undefined;
  }>({ open: false, featureLabel: "", requiredPlan: undefined, reason: undefined });

  const gate = (featureLabel: string, requiredPlan?: string, reason?: string) => {
    setState({ open: true, featureLabel, requiredPlan, reason });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const modal = (
    <GatingModal
      open={state.open}
      onClose={close}
      featureLabel={state.featureLabel}
      {...(state.requiredPlan !== undefined ? { requiredPlan: state.requiredPlan } : {})}
      {...(state.reason !== undefined ? { reason: state.reason } : {})}
    />
  );

  return { gate, modal };
}
