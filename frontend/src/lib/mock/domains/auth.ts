import { mockAdminPrincipal, mockTokens, mockUserPrincipal } from "../state";
import { json, noContent, type MockHandler } from "../shared";

export const authHandler: MockHandler = ({ path, method }) => {
  if ((path === "/auth/user/login" || path === "/user/login") && method === "POST") {
    return json(
      {
        access_token: mockTokens.access_token,
        token_type: "Bearer",
        account: {
          id: mockUserPrincipal.id,
          email: mockUserPrincipal.email,
          first_name: mockUserPrincipal.first_name,
          last_name: mockUserPrincipal.last_name,
        },
        workspace: mockUserPrincipal.workspaces[0],
        workspaces: mockUserPrincipal.workspaces,
      },
      200
    );
  }
  if ((path === "/auth/admin/login" || path === "/admin/login") && method === "POST") {
    return json(
      {
        access_token: mockTokens.access_token,
        token_type: "Bearer",
        admin: {
          id: mockAdminPrincipal.id,
          email: mockAdminPrincipal.email,
          first_name: mockAdminPrincipal.first_name,
          last_name: mockAdminPrincipal.last_name,
        },
      },
      200
    );
  }
  if (path === "/auth/refresh-token" && method === "GET") {
    return json(mockTokens);
  }
  if (path === "/auth/logout" && method === "POST") {
    return noContent();
  }
  return null;
};
