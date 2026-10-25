import Link from 'next/link';
import { FileText, Users, CheckCircle2, Gavel, Sheet, Bot, Warehouse, ShieldCheck, EyeOff } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight" style={{ color: '#1e2a4a' }}>
              BidChip
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#f97316' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 text-center" style={{ backgroundColor: '#1e2a4a' }}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            The B2B Marketplace for Electronic Components
          </h1>
          <p className="mt-5 text-lg text-blue-200">
            Reverse auctions, BOM sourcing, and AI-powered intake — built for electronics procurement
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-md px-8 py-3 text-base font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#f97316' }}
            >
              Start Sourcing
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-white px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[#1e2a4a]"
            >
              List Your Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#1e2a4a' }}>6.6M+</p>
            <p className="text-sm text-gray-500">Part Numbers</p>
          </div>
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#1e2a4a' }}>100%</p>
            <p className="text-sm text-gray-500">Warehouse Inspection on Every Order</p>
          </div>
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#1e2a4a' }}>5-Day</p>
            <p className="text-sm text-gray-500">Payout Protection</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: '#1e2a4a' }}>
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#1e2a4a' }}
              >
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: '#1e2a4a' }}>
                1. Post your requirements
              </h3>
              <p className="text-sm text-gray-500">
                Upload a BOM or create a listing for the components you need. AI can handle email attachments for you.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#1e2a4a' }}
              >
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: '#1e2a4a' }}>
                2. Suppliers bid
              </h3>
              <p className="text-sm text-gray-500">
                Verified suppliers compete in a reverse auction, driving your price down, not up.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#1e2a4a' }}
              >
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: '#1e2a4a' }}>
                3. Receive inspected parts
              </h3>
              <p className="text-sm text-gray-500">
                Every shipment passes through our warehouse for inspection before it reaches you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: '#1e2a4a' }}>
            Built for electronics procurement
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Gavel,
                title: 'Reverse Auctions',
                description: 'Suppliers compete for your business — you award to the best offer.',
              },
              {
                icon: Sheet,
                title: 'BOM Sourcing',
                description: 'Upload a bill of materials, get quotes on all lines simultaneously.',
              },
              {
                icon: Bot,
                title: 'AI Intake',
                description: 'Email us a spreadsheet — AI parses it and creates your auction automatically.',
              },
              {
                icon: Warehouse,
                title: 'Warehouse Inspection',
                description: 'Every shipment is inspected before it reaches you. Counterfeit protection included.',
              },
              {
                icon: ShieldCheck,
                title: 'Escrow Protection',
                description: 'Funds are held in escrow until you confirm receipt and acceptance.',
              },
              {
                icon: EyeOff,
                title: 'Anonymous Trading',
                description: 'Protect your sourcing strategy — counterparty identity revealed only after award.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#fff7ed' }}
                >
                  <Icon className="h-5 w-5" style={{ color: '#f97316' }} />
                </div>
                <h3 className="mb-1 text-base font-semibold" style={{ color: '#1e2a4a' }}>
                  {title}
                </h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: '#1e2a4a' }}>
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-white">Ready to start sourcing?</h2>
          <p className="mt-3 text-blue-200">
            Join thousands of buyers and suppliers on the leading B2B electronics marketplace.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block rounded-md px-10 py-3 text-base font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#f97316' }}
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <p>&copy; 2026 BidChip. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
