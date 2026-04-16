export type PortalModule =
  | "render-lab"
  | "fashion"
  | "references"
  | "uploads"
  | "works"
  | "admin";

export type PortalUser = {
  username: string;
  password: string;
  role: "admin" | "client";
  modules: PortalModule[];
};

export const portalUsers: PortalUser[] = [
  {
    username: "admin",
    password: "20832146",
    role: "admin",
    modules: [
      "admin",
      "render-lab",
      "fashion",
      "references",
      "uploads",
      "works",
    ],
  },
  {
    username: "render",
    password: "1234",
    role: "client",
    modules: ["render-lab"],
  },
];

export function canAccessModule(user: PortalUser | null, moduleName: PortalModule) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.modules.includes(moduleName);
}