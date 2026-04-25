import { FeatureMissing } from "../../components/ui/FeatureMissing";

export default function RegisterPage() {
  return (
    <FeatureMissing
      title="Înregistrare indisponibilă"
      description="Conturile noi trebuie create de un administrator prin endpoint-ul POST /admin/users sau POST /user/users. Înregistrarea self-service va reveni când backend-ul expune un endpoint public /auth/register."
      endpoint="POST /auth/register (nu există încă)"
      backTo="/login"
      backLabel="Înapoi la autentificare"
    />
  );
}
