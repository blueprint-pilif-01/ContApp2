import { FeatureMissing } from "../../components/ui/FeatureMissing";
import { AuthShell } from "./AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell>
      <div className="bg-frame/90 dark:bg-frame/95 border border-border/80 backdrop-blur-sm rounded-[1.25rem] p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
        <FeatureMissing
          embedded
          title="Înregistrare indisponibilă"
          description="Conturile noi trebuie create de un administrator prin endpoint-ul POST /admin/users sau POST /user/users. Înregistrarea self-service va reveni când backend-ul expune un endpoint public /auth/register."
          endpoint="POST /auth/register (nu există încă)"
          backTo="/login"
          backLabel="Înapoi la autentificare"
        />
      </div>
    </AuthShell>
  );
}
