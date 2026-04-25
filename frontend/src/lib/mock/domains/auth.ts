import { mockAdminPrincipal, mockTokens, mockUserPrincipal } from "../state";
import { json, noContent, type MockHandler } from "../shared";

export const authHandler: MockHandler = ({ path, method }) => {
  if ((path === "/auth/user/login" || path === "/user/login") && method === "POST") {
    return json({ token: mockTokens, user: mockUserPrincipal }, 202);
  }
  if ((path === "/auth/admin/login" || path === "/admin/login") && method === "POST") {
    return json({ token: mockTokens, admin: mockAdminPrincipal }, 202);
  }
  if (path === "/auth/refresh-token" && method === "GET") {
    return json(mockTokens);
  }
  if (path === "/auth/logout" && method === "POST") {
    return noContent();
  }
  return null;
};
