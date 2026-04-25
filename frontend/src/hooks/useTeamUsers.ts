import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface TeamUserDTO {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_id?: number;
  role_ids?: number[];
  status: string;
  title?: string;
  first_name?: string;
  last_name?: string;
}

export interface TeamUserUpsert {
  name?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
  role_ids?: number[];
  status?: string;
  title?: string;
  organisation_id?: number;
  type?: string;
  password?: string;
  signature_id?: number;
}

export const TEAM_USERS_KEY = ["team-users"] as const;

export function useTeamUsers() {
  return useQuery<TeamUserDTO[]>({
    queryKey: [...TEAM_USERS_KEY, "list"],
    queryFn: () => api.get<TeamUserDTO[]>("/settings/users"),
    staleTime: 30_000,
  });
}

export function useUpdateTeamUser(id: number) {
  const qc = useQueryClient();
  return useMutation<TeamUserDTO, unknown, TeamUserUpsert>({
    mutationFn: (payload) =>
      api.put<TeamUserDTO>(`/settings/users/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_USERS_KEY }),
  });
}

/** Tries first/last name then falls back to `name`. */
export function teamUserDisplayName(u?: TeamUserDTO): string {
  if (!u) return "";
  const fl = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return fl || u.name || u.email || `User #${u.id}`;
}
