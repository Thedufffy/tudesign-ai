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
    username: "render",
    password: "1234",
    role: "client",
    modules: ["render-lab"],
  },
];