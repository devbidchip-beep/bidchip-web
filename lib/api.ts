import axios from 'axios';
import type {
  Part,
  PartSearchResult,
  Listing,
  ListingDetail,
  PaginatedResponse,
  CreateListingPayload,
  Bid,
  Award,
  PlaceBidPayload,
  OrderPricing,
  Order,
  CheckoutPayload,
  CheckoutResponse,
} from '@/types/api';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token from session if available
api.interceptors.request.use((config) => {
  // Token will be set by auth layer — in practice, set via setAuthToken() below
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Normalize error shape
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

/**
 * Call this after obtaining a token from next-auth to attach it to all requests.
 */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;

// Catalog
export const searchParts = (q: string, limit = 20) =>
  api.get<PartSearchResult[]>('/catalog/parts/search/', { params: { q, limit } });

export const getPartDetail = (id: number) => api.get<Part>(`/catalog/parts/${id}/`);

// Listings
export const getListings = (params?: { status?: string; kind?: string }) =>
  api.get<PaginatedResponse<Listing>>('/listings/', { params });

export const getPublishedListings = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<Listing>>('/listings/published/', { params });

export const getListingDetail = (id: string) =>
  api.get<ListingDetail>(`/listings/${id}/`);

export const createListing = (data: CreateListingPayload) =>
  api.post<ListingDetail>('/listings/', data);

export const publishListing = (id: string) =>
  api.post<ListingDetail>(`/listings/${id}/publish/`);

// Bidding
export const getBidsForLine = (lineId: string) =>
  api.get<Bid[]>('/bidding/bids/', { params: { line: lineId } });

export const placeBid = (data: PlaceBidPayload) =>
  api.post<Bid>('/bidding/bids/place/', data);

export const withdrawBid = (bidId: string) =>
  api.post<Bid>(`/bidding/bids/${bidId}/withdraw/`);

export const awardLine = (lineId: string, awards: { bid: string; quantity: number }[]) =>
  api.post<Award[]>(`/bidding/lines/${lineId}/award/`, { awards });

// Pricing
export const previewOrderPricing = (data: CheckoutPayload & { preview: true }) =>
  api.post<OrderPricing>('/payments/checkout/', { ...data, preview: true });

// Orders
export const getOrders = (params?: { status?: string }) =>
  api.get<PaginatedResponse<Order>>('/orders/', { params });

export const getOrderDetail = (id: string) =>
  api.get<Order>(`/orders/${id}/`);

// Payments
export const initiateCheckout = (data: CheckoutPayload) =>
  api.post<CheckoutResponse>('/payments/checkout/', data);

export const getStripeConnectLink = () =>
  api.post<{ account_link_url: string }>('/payments/stripe/connect/');
