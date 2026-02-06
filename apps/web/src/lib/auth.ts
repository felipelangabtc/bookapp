import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma, type UserRole } from '@bookapp/db';
import { compare, hash } from 'bcryptjs';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';


// Extend the built-in types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in');
        }

        if (user.isBanned) {
          throw new Error('Your account has been suspended');
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        };
      },
    }),
    // OAuth providers - only enabled if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
        token.role = user.role;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            username: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        });
        if (updatedUser) {
          token.username = updatedUser.username;
          token.displayName = updatedUser.displayName;
          token.avatar = updatedUser.avatar;
          token.role = updatedUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          username: token.username,
          displayName: token.displayName,
          avatar: token.avatar,
          role: token.role,
        };
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth sign-ins, check if user exists and if they're banned
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser?.isBanned) {
          return false;
        }
      }
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SIGN_IN',
          entityType: 'USER',
          entityId: user.id,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
    },
  },
};

// Helper functions
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateUsername(email: string): string {
  const base = email.split('@')[0]!.replace(/[^a-zA-Z0-9]/g, '');
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}${random}`.toLowerCase().substring(0, 20);
}
