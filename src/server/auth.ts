import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import KeycloakProvider from 'next-auth/providers/keycloak';

import { env } from "@energyapp/env";
import { db } from "@energyapp/server/db";
import { type Adapter, type AdapterAccount } from "next-auth/adapters";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

const prismaAdapter = PrismaAdapter(db);

const CustomPrismaAdapter: Adapter = {
  ...prismaAdapter,
  linkAccount: (account: AdapterAccount) => {
    delete account["not-before-policy"];
    return prismaAdapter.linkAccount?.(account);
  },
};

const decode = function (token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64').toString())
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    session: async ({ session, token, user }) => {
      return ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      });

    },
  },
  events: {
    async signIn(message) {
      // console.log('signIn', message);

      // Get the user and account objects from the message
      const { user, account } = message;

      // Update the account in the database
      if (account) {
        await db.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: {
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: Number(account.expires_at),
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
            refresh_expires_in: Number(account.refresh_expires_in),
          },
        });

        // Update accesses from attributes to database
        await updateUserAccesses(user.id, account.access_token);
      }
    },
  },
  adapter: CustomPrismaAdapter,
  providers: [
    KeycloakProvider({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,

    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);

const updateUserAccesses = async (userId: string, token?: string) => {
  if (!token) { return; }

  const decoded = decode(token);
  // console.log('decoded', decoded);

  const accessIds = decoded['access-id'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
  const accessIdSet = new Set(accessIds.map((accessId: any) => `${accessId.id}-${accessId.type}`));

  // Fetch all userAccess rows for the user
  const userAccesses = await db.userAccess.findMany({
    where: {
      userId,
    },
  });

  // Delete the userAccess rows that are not in accessIds
  for (const userAccess of userAccesses) {
    if (!accessIdSet.has(`${userAccess.accessId}-${userAccess.type}`)) {
      await db.userAccess.delete({
        where: {
          id: userAccess.id,
        },
      });
    }
  }

  // Create the userAccess rows that are in accessIds but not in the database
  for (const accessId of accessIds) {
    const id = accessId.id;
    const type = accessId.type;

    const access = await db.userAccess.findFirst({
      where: {
        accessId: id,
        userId,
        type: type,
      },
    });

    if (!access) {
      await db.userAccess.create({
        data: {
          accessId: id,
          userId,
          type: type,
        },
      });
    }
  }
}
