import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    redirectUrl?: string;
  }

  interface Session {
    user: User & {
      role: Role;
      redirectUrl?: string;
    };
  }
}