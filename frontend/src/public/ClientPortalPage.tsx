import { Navigate, useParams } from "react-router-dom";

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Link invalid</h1>
          <p className="text-muted-foreground">
            Acest link de portal nu este valid sau a expirat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Navigate
      to={`/public/sign/${encodeURIComponent(token)}`}
      replace
    />
  );
}
