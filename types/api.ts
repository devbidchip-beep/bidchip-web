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

export interface Bid {
  id: string;
  line: string; // ListingLine id
  supplier_company: string; // Company id (may be hidden)
  supplier_company_name?: string; // only visible to staff/buyer
  placed_by: string;
  unit_price: string; // Decimal as string
  quantity_offered: number;
  date_code_year: number | null;
  packaging: ListingLine['packaging'];
  lead_time_days: number;
  is_exact_match: boolean;
  exception_reasons: string[]; // 'qty_short' | 'date_code' | 'packaging'
  status: 'active' | 'withdrawn' | 'won' | 'partially_won' | 'lost';
  supplier_net_shown: string | null;
  created_at: string;
}

export interface Award {
  id: string;
  line: string;
  bid: Bid;
  quantity_awarded: number;
  unit_price: string;
  rank: number;
  awarded_by: string | null;
  awarded_at: string;
  status: 'awarded' | 'converted' | 'cancelled';
}

export interface PlaceBidPayload {
  line: string;
  unit_price: string;
  quantity_offered: number;
  date_code_year?: number;
  packaging?: ListingLine['packaging'];
  lead_time_days?: number;
}

// Pricing
export interface OrderPricing {
  principal: string;
  buyer_fee: string;
  seller_fee: string;
  inspection_fee: string;
  compliance_fee: string;
  shipping_estimate: string;
  oem_uplift: string;
  tax_total: string;
  card_surcharge: string;
  card_surcharge_rate: string;
  grand_total: string;
  seller_payout: string;
}

// Orders
export interface Order {
  id: string;
  number: string;
  buyer_company: string;
  listing: string;
  po_number: string | null;
  status: 'payment_pending' | 'paid' | 'in_fulfillment' | 'partially_shipped' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  ship_to_snapshot: Record<string, string>;
  currency: string;
  principal_total: string;
  buyer_fee_total: string;
  inspection_fee_total: string;
  compliance_fee_total: string;
  shipping_estimate: string;
  shipping_final: string | null;
  oem_uplift_total: string;
  tax_total: string;
  card_surcharge: string;
  grand_total: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  supplier_orders?: SupplierOrder[];
}

export interface SupplierOrder {
  id: string;
  anonymous_supplier_id: string;
  status: 'awarded' | 'paid' | 'shipped_to_warehouse' | 'at_warehouse' | 'inspected' | 'failed_inspection' | 'shipped_to_buyer' | 'delivered' | 'payout_released' | 'disputed' | 'cancelled' | 'refunded';
  risk_tier: 'green' | 'yellow' | 'red';
  principal: string;
  seller_fee: string;
  payout_amount: string;
  hold_days: number | null;
  delivered_at: string | null;
  payout_eligible_at: string | null;
  lines: OrderLine[];
}

export interface OrderLine {
  id: string;
  listing_line: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  status: 'pending' | 'received' | 'passed' | 'failed_inspection' | 'shipped' | 'refunded';
}

export interface CheckoutPayload {
  listing_id: string;
  award_ids: string[];
  ship_to_id: string;
  payment_method: 'card' | 'ach' | 'wire';
  po_number?: string;
}

export interface CheckoutResponse {
  order_id: string;
  client_secret: string | null;  // for Stripe card payment
  grand_total: string;
  order_number: string;
}

export interface Payout {
  id: string;
  supplier_order: string;
  amount: string;
  currency: string;
  status: 'scheduled' | 'awaiting_release' | 'released' | 'failed' | 'reversed';
  released_at: string | null;
}

export interface Shipment {
  id: string;
  leg: 'inbound' | 'outbound' | 'return_to_bidchip' | 'return_to_owner';
  carrier: 'ups' | 'fedex' | 'dhl' | 'other';
  service_code: string;
  tracking_number: string;
  paid_by: 'supplier' | 'buyer' | 'bidchip';
  cost_estimated: string;
  cost_actual: string;
  status: 'draft' | 'label_created' | 'in_transit' | 'delivered' | 'exception' | 'returned';
  shipped_at: string | null;
  delivered_at: string | null;
  is_partial: boolean;
  packages: Package[];
  rate_quotes: RateQuote[];
}

export interface Package {
  id: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  weight_kg: string;
  sized_by: 'ai' | 'warehouse' | 'supplier';
}

export interface RateQuote {
  id: string;
  carrier: 'ups' | 'fedex' | 'dhl';
  service_code: string;
  service_name: string;
  amount: string;
  currency: string;
  transit_days: number | null;
  is_next_day: boolean;
  chosen: boolean;
  quoted_at: string;
}

export interface Inspection {
  id: string;
  supplier_order: string;
  inspector: string;
  level: 'standard' | 'extended' | 'full_lab';
  result: 'passed' | 'failed' | 'partial' | null;
  notes: string;
  counted_quantity: number | null;
  inspected_at: string | null;
  photos: InspectionPhoto[];
}

export interface InspectionPhoto {
  id: string;
  file_url: string;
  caption: string;
  order_line: string | null;
}

export interface LabTest {
  id: string;
  order_line: string;
  method: string;
  price: string;
  result: 'pass' | 'fail' | 'inconclusive' | null;
  report: string | null;
  completed_at: string | null;
}

export interface Dispute {
  id: string;
  supplier_order: string;
  opened_by: string;
  reason: 'not_as_described' | 'quantity' | 'counterfeit_suspected' | 'damaged' | 'not_received' | 'other';
  description: string;
  status: 'open' | 'awaiting_return' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'split' | 'withdrawn';
  resolution_note: string;
  resolved_by: string | null;
  opened_at: string;
  resolved_at: string | null;
}

export interface Rating {
  id: string;
  supplier_order: string | null;
  rater_company: string;
  ratee_company: string;
  direction: 'buyer_to_supplier' | 'supplier_to_buyer';
  quality: number;
  communication: number;
  shipping: number;
  documentation: number;
  average_score: number;
  comment: string;
  created_at: string;
}

export interface Message {
  id: string;
  body: string;
  moderation_status: 'pending' | 'approved' | 'blocked';
  sent_at: string;
  is_own: boolean;
}

export interface MessageThread {
  id: string;
  listing: string | null;
  supplier_order: string | null;
  status: 'open' | 'closed';
  messages: Message[];
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  supplier_order: string;
  tier: 'green' | 'yellow' | 'red';
  score: number;
  override_tier: 'green' | 'yellow' | 'red' | null;
  assessed_at: string;
}

export interface IntakeFile {
  id: string;
  filename: string;
  mime: string;
  kind: 'xlsx' | 'csv' | 'pdf' | 'image' | 'body_text';
  text_extracted: boolean;
}

export interface IntakeExtractionLine {
  mpn: string;
  manufacturer: string | null;
  quantity: number;
  target_price: number | null;
  date_code_year: number | null;
  packaging: string | null;
  ncnr: boolean;
  require_as6081: boolean;
  notes: string | null;
  confidence: number;
  catalog_match: 'exact' | 'fuzzy' | 'none';
  part_id: number | null;
  manufacturer_logo: string | null;
}

export interface IntakeExtraction {
  id: string;
  model: string;
  prompt_version: string;
  result: {
    title?: string;
    lines: IntakeExtractionLine[];
    overall_confidence: number;
  };
  confidence: string;
  line_count: number;
  listing: { id: string; number: string } | null;
}

export interface IntakeMessage {
  id: string;
  channel: 'email' | 'upload' | 'api';
  from_email: string | null;
  status: 'received' | 'extracting' | 'needs_review' | 'draft_created' | 'failed' | 'rejected_sender';
  subject: string;
  received_at: string;
  files: IntakeFile[];
  extractions: IntakeExtraction[];
}

export interface InventoryItem {
  id: string;
  company: string;
  part: number | null;
  mpn_raw: string;
  manufacturer_raw: string;
  quantity: number;
  date_code_year: number | null;
  packaging: string | null;
  unit_price: string | null;
  currency: string;
  ship_from_country: string;
  source: 'csv' | 'email' | 'api' | 'manual';
  is_active: boolean;
  created_at: string;
}

export interface InventoryImport {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  rows_total: number;
  rows_ok: number;
  rows_failed: number;
  error_report_url: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  company: string;
  email: string;
  role: CompanyMember['role'];
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  member: string;
  period_start: string;
  period: 'month' | 'quarter';
  amount: string;
  currency: string;
  spent_this_period: string;
}

export interface OrderLimit {
  id: string;
  member: string;
  max_order_amount: string;
  currency: string;
}

export interface ApprovalRequest {
  id: string;
  company: string;
  requested_by_name: string;
  approver_name: string | null;
  subject_type: 'listing_publish' | 'checkout';
  listing: string | null;
  order: string | null;
  amount: string | null;
  status: 'pending' | 'approved' | 'rejected';
  decided_at: string | null;
  note: string;
  created_at: string;
}

export interface SpendingReportRow {
  member_name: string;
  role: CompanyMember['role'];
  order_count: number;
  total_spent: string;
  currency: string;
}
