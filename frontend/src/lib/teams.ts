import { useEffect, useMemo, useState } from "react";

export interface LocalTeam {
  id: string;
  name: string;
  description: string;
  color: string;
  memberIds: number[];
  createdAt: string;
  updatedAt: string;
}

const FALLBACK_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

function storageKey(organisationID: number | null | undefined): string {
  return `contapp_local_teams_${organisationID ?? "workspace"}`;
}

export function readLocalTeams(organisationID: number | null | undefined): LocalTeam[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(organisationID)) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalTeam);
  } catch {
    return [];
  }
}

export function writeLocalTeams(
  organisationID: number | null | undefined,
  teams: LocalTeam[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(organisationID), JSON.stringify(teams));
}

export function useLocalTeams(organisationID: number | null | undefined) {
  const [teams, setTeams] = useState<LocalTeam[]>(() => readLocalTeams(organisationID));

  useEffect(() => {
    setTeams(readLocalTeams(organisationID));
  }, [organisationID]);

  const api = useMemo(
    () => ({
      teams,
      createTeam(input: { name: string; description?: string; memberIds?: number[] }) {
        const now = new Date().toISOString();
        const next: LocalTeam = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: input.name.trim(),
          description: input.description?.trim() ?? "",
          color: FALLBACK_COLORS[teams.length % FALLBACK_COLORS.length] ?? "#3b82f6",
          memberIds: input.memberIds ?? [],
          createdAt: now,
          updatedAt: now,
        };
        setTeams((current) => {
          const updated = [...current, next];
          writeLocalTeams(organisationID, updated);
          return updated;
        });
        return next;
      },
      updateTeam(id: string, input: Partial<Pick<LocalTeam, "name" | "description" | "color" | "memberIds">>) {
        setTeams((current) => {
          const updated = current.map((team) =>
            team.id === id
              ? {
                  ...team,
                  ...input,
                  name: input.name?.trim() ?? team.name,
                  description: input.description?.trim() ?? team.description,
                  updatedAt: new Date().toISOString(),
                }
              : team
          );
          writeLocalTeams(organisationID, updated);
          return updated;
        });
      },
      deleteTeam(id: string) {
        setTeams((current) => {
          const updated = current.filter((team) => team.id !== id);
          writeLocalTeams(organisationID, updated);
          return updated;
        });
      },
    }),
    [organisationID, teams]
  );

  return api;
}

export function teamMemberCount(team: LocalTeam): number {
  return team.memberIds.length;
}

function isLocalTeam(value: unknown): value is LocalTeam {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    Array.isArray(item.memberIds)
  );
}
