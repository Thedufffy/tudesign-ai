export type FashionRole = "admin" | "client";

type FashionUser = {
  id: string;
  companyName: string;
  username: string;
  password: string;
  credits: number;
  generatedCount: number;
  isActive: boolean;
  role: FashionRole;
};

export type PublicFashionUser = Omit<FashionUser, "password">;

const users: FashionUser[] = [
  {
    id: "1",
    companyName: "Admin",
    username: "admin",
    password: "20832146",
    credits: 999,
    generatedCount: 0,
    isActive: true,
    role: "admin",
  },
  {
    id: "2",
    companyName: "B Firması",
    username: "b_firma",
    password: "5678",
    credits: 10,
    generatedCount: 0,
    isActive: true,
    role: "client",
  },
];

export function findUserByCredentials(username: string, password: string) {
  return users.find(
    (user) =>
      user.username === username &&
      user.password === password &&
      user.isActive
  );
}

export function findUserById(id: string) {
  return users.find((user) => user.id === id && user.isActive);
}

export function findUserByIdIncludingInactive(id: string) {
  return users.find((user) => user.id === id);
}

export function findUserByUsername(username: string) {
  return users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

export function getPublicUser(user: FashionUser): PublicFashionUser {
  const { password, ...rest } = user;
  return rest;
}

export function getAllPublicUsers(): PublicFashionUser[] {
  return users.map(getPublicUser);
}

export function decrementCredit(userId: string, amount = 1) {
  const user = users.find((u) => u.id === userId && u.isActive);

  if (!user) {
    return { ok: false, message: "Kullanıcı bulunamadı." };
  }

  if (user.credits < amount) {
    return { ok: false, message: "Yetersiz kredi." };
  }

  user.credits -= amount;

  return {
    ok: true,
    credits: user.credits,
  };
}

export function incrementGenerationCount(userId: string, amount = 1) {
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { ok: false, message: "Kullanıcı bulunamadı." };
  }

  user.generatedCount += amount;

  return {
    ok: true,
    generatedCount: user.generatedCount,
  };
}

export function createFashionUser(input: {
  companyName: string;
  username: string;
  password: string;
  credits: number;
  role?: FashionRole;
}) {
  const usernameExists = users.some(
    (user) => user.username.toLowerCase() === input.username.toLowerCase()
  );

  if (usernameExists) {
    return { ok: false, message: "Bu kullanıcı adı zaten mevcut." };
  }

  const nextId = String(Date.now());

  const newUser: FashionUser = {
    id: nextId,
    companyName: input.companyName,
    username: input.username,
    password: input.password,
    credits: input.credits,
    generatedCount: 0,
    isActive: true,
    role: input.role || "client",
  };

  users.push(newUser);

  return {
    ok: true,
    user: getPublicUser(newUser),
  };
}

export function updateFashionUser(input: {
  id: string;
  companyName?: string;
  username?: string;
  password?: string;
  credits?: number;
  isActive?: boolean;
  role?: FashionRole;
}) {
  const user = users.find((item) => item.id === input.id);

  if (!user) {
    return { ok: false, message: "Kullanıcı bulunamadı." };
  }

  if (typeof input.username === "string" && input.username !== user.username) {
    const usernameExists = users.some(
      (item) =>
        item.id !== user.id &&
        item.username.toLowerCase() === input.username!.toLowerCase()
    );

    if (usernameExists) {
      return { ok: false, message: "Bu kullanıcı adı zaten mevcut." };
    }

    user.username = input.username;
  }

  if (typeof input.companyName === "string" && input.companyName.trim()) {
    user.companyName = input.companyName;
  }

  if (typeof input.password === "string" && input.password.trim()) {
    user.password = input.password;
  }

  if (typeof input.credits === "number" && !Number.isNaN(input.credits)) {
    user.credits = input.credits;
  }

  if (typeof input.isActive === "boolean") {
    user.isActive = input.isActive;
  }

  if (input.role === "admin" || input.role === "client") {
    user.role = input.role;
  }

  return {
    ok: true,
    user: getPublicUser(user),
  };
}