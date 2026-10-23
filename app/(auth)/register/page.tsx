import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-lg bg-background p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create your BidChip account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Register your company to start sourcing and listing components
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
