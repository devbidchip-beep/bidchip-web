import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

        try {
          const res = await fetch(`${apiUrl}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();

          // Expected response shape from Django API:
          // { token: string, user: { id, email, full_name, staff_role, ... } }
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name,
            accessToken: data.token,
            staffRole: data.user.staff_role ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.staffRole = (user as { staffRole?: string | null }).staffRole;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      if (session.user) {
        session.user.staffRole = token.staffRole as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// Augment next-auth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      staffRole?: string | null;
    };
  }
}
