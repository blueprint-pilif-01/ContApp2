import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { isApiError } from "../../../lib/api";
import {
  useCreateTemplate,
  useTemplate,
  useDeleteTemplate,
  useUpdateTemplate,
} from "../../../hooks/useTemplates";
import { ContractEditor } from "../../editor/ContractEditor";

const EMPTY_CONTRACT_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function normalizeContentJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through to an empty editor document
    }
  }
  return EMPTY_CONTRACT_DOC;
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? Number.parseInt(id, 10) : NaN;
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const { data: template, refetch } = useTemplate(
    !isNew && Number.isFinite(numericId) ? numericId : undefined
  );

  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("services");
  const [content, setContent] = useState<Record<string, unknown> | undefined>(
    undefined
  );

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(
    Number.isFinite(numericId) ? numericId : 0
  );
  const deleteTemplate = useDeleteTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContractType(template.contract_type);
      setContent(normalizeContentJson(template.content_json));
    }
  }, [template]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Introdu un nume pentru șablon.");
      return;
    }
    const payload = {
      name: name.trim(),
      contract_type: contractType.trim() || "services",
      content_json: content ?? EMPTY_CONTRACT_DOC,
    };

    if (isNew) {
      createTemplate.mutate(
        payload,
        {
          onSuccess: (res) => {
            toast.success("Șablon creat.");
            if (res.id) {
              navigate(`/app/contracts/templates/${res.id}/edit`, {
                replace: true,
              });
            }
          },
          onError: (e) =>
            toast.error(
              isApiError(e) ? e.message : "Nu am putut crea șablonul."
            ),
        }
      );
      return;
    }

    if (!Number.isFinite(numericId)) return;
    updateTemplate.mutate(payload, {
      onSuccess: () => {
        toast.success("Șablon salvat.");
        refetch();
      },
      onError: (e) =>
        toast.error(
          isApiError(e) ? e.message : "Nu am putut salva șablonul."
        ),
    });
  };

  const handleDelete = () => {
    if (!Number.isFinite(numericId)) return;
    if (!window.confirm("Ștergi acest șablon?")) return;
    deleteTemplate.mutate(numericId, {
      onSuccess: () => {
        toast.success("Șablon șters.");
        navigate("/app/contracts/templates");
      },
      onError: (e) =>
        toast.error(
          isApiError(e) ? e.message : "Nu am putut șterge șablonul."
        ),
    });
  };

  const saving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isNew ? "Șablon nou" : template?.name ?? `Șablon #${numericId}`}
        description={
          isNew
            ? "Construiește șablonul cu editorul vizual."
            : `ID #${numericId} · tip ${template?.contract_type ?? "—"}`
        }
        actions={
          <Link to="/app/contracts/templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-frame p-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Nume șablon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Contract prestări servicii contabilitate"
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-1 min-w-[180px]">
            <Input
              label="Tip contract"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              placeholder="services"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end">
          {!isNew && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleteTemplate.isPending}
            >
              Șterge
            </Button>
          )}
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            {isNew ? "Creează" : "Salvează"}
          </Button>
        </div>
      </div>

      <ContractEditor
        initialContent={content}
        onChange={setContent}
      />
    </div>
  );
}
