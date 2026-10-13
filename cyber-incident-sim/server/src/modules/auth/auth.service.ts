import argon2 from "argon2";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function hashSessionToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<PublicUser> {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError("Unable to create account with these details", 409);
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
    },
  });

  return toPublicUser(user);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: PublicUser; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    password
  );

  if (!passwordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function getUserFromSession(
  token: string
): Promise<PublicUser | null> {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });

    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return toPublicUser(session.user);
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}