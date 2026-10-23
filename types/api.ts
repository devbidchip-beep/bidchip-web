export interface Company {
  id: string;
  legal_name: string;
  display_name: string;
  country: string;
  is_buyer: boolean;
  is_supplier: boolean;
  is_oem: boolean;
  is_ems: boolean;
  status: 'limited' | 'pending_review' | 'verified' | 'suspended' | 'closed';
  integrity_score: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  staff_role: 'admin' | 'trusty' | 'warehouse' | 'lab' | 'compliance' | 'support' | null;
  is_active: boolean;
  mfa_required: boolean;
  last_login_at: string | null;
}

export interface CompanyMember {
  id: string;
  user: User;
  company: Company;
  role: 'owner' | 'finance' | 'manager' | 'buyer' | 'seller' | 'read_only';
  can_release_payout: boolean;
  status: 'active' | 'suspended' | 'left';
}

export interface Listing {
  id: string;
  number: string;
  kind: 'reverse' | 'bom' | 'rfq' | 'forward';
  status:
    | 'draft'
    | 'pending_approval'
    | 'published'
    | 'closed'
    | 'awarded'
    | 'cancelled'
    | 'expired';
  title: string;
  ends_at: string;
  currency: string;
  created_at: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
