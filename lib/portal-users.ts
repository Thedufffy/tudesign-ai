export type PortalUser = {
  username: string;
  password: string;
  isAdmin?: boolean;
  canAccessRenderLab?: boolean;
  canAccessFashion?: boolean;
  canAccessReferences?: boolean;
  canAccessUploads?: boolean;
  canAccessWorks?: boolean;
};

export const portalUsers: PortalUser[] = [
  {
    username: "admin",
    password: "1234",
    isAdmin: true,
    canAccessRenderLab: true,
    canAccessFashion: true,
    canAccessReferences: true,
    canAccessUploads: true,
    canAccessWorks: true,
  },
  {
    username: "render",
    password: "1234",
    canAccessRenderLab: true,
    canAccessFashion: false,
    canAccessReferences: false,
    canAccessUploads: false,
    canAccessWorks: false,
  },
];