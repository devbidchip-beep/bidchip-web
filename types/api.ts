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
  ends_at: string | null;
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

export interface Manufacturer {
  id: string;
  name: string;
  name_normalized: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface Part {
  id: number; // bigint — number in TS
  mpn: string;
  mpn_normalized: string;
  manufacturer: Manufacturer;
  description: string;
  category: string;
  lifecycle: 'active' | 'nrnd' | 'eol' | 'obsolete' | null;
  eccn: string | null;
  is_itar: boolean;
  hts_code: string | null;
}

export interface PartSearchResult {
  id: number;
  mpn: string;
  manufacturer_name: string;
  description: string;
  category: string;
  lifecycle: Part['lifecycle'];
}

export interface ListingLine {
  id: string;
  line_no: number;
  part: Part | null;
  mpn_raw: string;
  manufacturer_raw: string;
  manufacturer: Manufacturer | null;
  quantity: number;
  target_unit_price: string | null;
  date_code_year_min: number | null;
  packaging: 'reel' | 'cut_tape' | 'tray' | 'tube' | 'bulk' | 'other' | null;
  allow_exceptions: boolean;
  allow_split: boolean;
  require_as6081: boolean;
  docs_required: boolean;
  ncnr: boolean;
  compliance_status: 'clear' | 'flagged' | 'officer_review' | 'approved' | 'rejected';
  status: 'open' | 'awarded' | 'partially_awarded' | 'no_award';
}

export interface ListingDetail extends Listing {
  lines: ListingLine[];
  ship_to: string | null;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
  invite_only: boolean;
  anonymous: boolean;
  published_at: string | null;
}

export interface CreateListingLine {
  mpn_raw: string;
  manufacturer_raw?: string;
  quantity: number;
  target_unit_price?: string;
  date_code_year_min?: number;
  packaging?: ListingLine['packaging'];
  allow_exceptions?: boolean;
  allow_split?: boolean;
  require_as6081?: boolean;
  docs_required?: boolean;
  ncnr?: boolean;
}

export interface CreateListingPayload {
  title: string;
  kind: 'reverse' | 'bom';
  duration_minutes?: number;
  currency?: string;
  ship_to?: string;
  lines: CreateListingLine[];
}
