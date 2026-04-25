import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { BackendNote } from "../../../components/ui/BackendNote";
import { useToast } from "../../../components/ui/Toast";
import { isApiError } from "../../../lib/api";
import {
  useCreateTemplate,
  useTemplate,
  useDeleteTemplate,
} from "../../../hooks/useTemplates";
import {
  useCreateTemplateField,
  useTemplateField,
} from "../../../hooks/useTemplateFields";
import { usePrincipal } from "../../../hooks/useMe";
import { ContractEditor } from "../../editor/ContractEditor";

/**
 * The backend models contract templates as `{ name, contract_type }` with
 * the rich body stored separately as one or more `template_fields` whose
 * `data` column is a free-form string. The editor's TipTap JSON is
 * serialized into that string. There is no `PUT /template-fields/:id`, so
 * every save creates a **new snapshot**; the latest-created field id is
 * treated as the current content.
 */
export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? Number.parseInt(id, 10) : NaN;
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const principal = usePrincipal();

  const { data: template, refetch } = useTemplate(
    !isNew && Number.isFinite(numericId) ? numericId : undefined
  );

  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("services");
  const [content, setContent] = useState<Record<string, unknown> | undefined>(
    undefined
  );
  const [lastFieldId, setLastFieldId] = useState<number | null>(null);

  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createField = useCreateTemplateField();
  const { data: currentField } = useTemplateField(
    lastFieldId ?? undefined
  );

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContractType(template.contract_type);
    }
  }, [template]);

  useEffect(() => {
    if (!currentField?.data) return;
    try {
      const parsed = JSON.parse(currentField.data) as Record<string, unknown>;
      setContent(parsed);
    } catch {
      // older/free-form data — leave it alone
    }
  }, [currentField]);

  const saveSnapshot = (templateId: number, json: Record<string, unknown>) => {
    const now = new Date().toISOString();
    createField.mutate(
      {
        template_id: templateId,
        data: JSON.stringify(json),
        date_added: now,
        date_modified: now,
      },
      {
        onSuccess: (res) => {
          if (res.id) setLastFieldId(res.id);
          toast.success("Conținut salvat ca versiune nouă.");
        },
        onError: (e) =>
          toast.error(
            isApiError(e) ? e.message : "Nu am putut salva conținutul."
          ),
      }
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Introdu un nume pentru șablon.");
      return;
    }
    if (isNew) {
      createTemplate.mutate(
        {
          name,
          contract_type: contractType,
          user_id: principal?.kind === "user" ? principal.id : 0,
          organisation_id:
            principal?.kind === "user" ? principal.organisation_id ?? 0 : 0,
        },
        {
          onSuccess: (res) => {
            toast.success("Șablon creat.");
            if (res.id) {
              if (content) saveSnapshot(res.id, content);
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

    if (Number.isFinite(numericId) && content) {
      saveSnapshot(numericId, content);
      refetch();
    }
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

  const saving = createTemplate.isPending || createField.isPending;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isNew ? "Șablon nou" : template?.name ?? `Șablon #${numericId}`}
        description={
          isNew
            ? "Construiește șablonul cu editorul vizual. La salvare se creează șablonul și o primă versiune de conținut."
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

      <BackendNote>
        Conținutul editorului este serializat ca JSON și stocat într-un{" "}
        <code>template_field.data</code>. Backend-ul nu expune{" "}
        <code>PUT /template-fields/:id</code>, așa că fiecare salvare creează
        o versiune nouă; cea mai recentă devine implicit activă.
      </BackendNote>

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
            {isNew ? "Creează" : "Salvează versiune"}
          </Button>
        </div>
      </div>

      <ContractEditor
        initialContent={content}
        onChange={setContent}
      />

      {!isNew && lastFieldId !== null && (
        <p className="text-xs text-muted-foreground">
          Ultima versiune salvată: field #{lastFieldId}
        </p>
      )}
    </div>
  );
}
