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
  RateQuote,
  Dispute,
  Rating,
  Message,
  MessageThread,
  IntakeMessage,
  InventoryItem,
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

// Logistics
export const getShipmentRates = (shipmentId: string) =>
  api.post<RateQuote[]>(`/logistics/shipments/${shipmentId}/rates/`);

export const chooseRate = (shipmentId: string, rateQuoteId: string) =>
  api.post<void>(`/logistics/shipments/${shipmentId}/choose-rate/`, { rate_quote_id: rateQuoteId });

export const createLabel = (shipmentId: string) =>
  api.post<{ tracking_number: string; label_url: string }>(`/logistics/shipments/${shipmentId}/label/`);

export const markShipped = (supplierOrderId: string, data: { carrier: string; tracking_number: string }) =>
  api.post<void>(`/logistics/supplier-orders/${supplierOrderId}/mark-shipped/`, data);

export const buyerConfirmDelivery = (supplierOrderId: string) =>
  api.post<void>(`/logistics/supplier-orders/${supplierOrderId}/buyer-confirm-delivery/`);

// Trust
export const getDisputes = () =>
  api.get<PaginatedResponse<Dispute>>('/trust/disputes/');

export const openDispute = (data: { supplier_order: string; reason: string; description: string }) =>
  api.post<Dispute>('/trust/disputes/', data);

export const resolveDispute = (id: string, data: { status: string; resolution_note: string }) =>
  api.patch<Dispute>(`/trust/disputes/${id}/`, data);

export const submitRating = (data: {
  supplier_order: string;
  direction: string;
  quality: number;
  communication: number;
  shipping: number;
  documentation: number;
  comment?: string;
}) => api.post<Rating>('/trust/ratings/', data);

export const getThreads = () =>
  api.get<PaginatedResponse<MessageThread>>('/trust/threads/');

export const getThread = (id: string) =>
  api.get<MessageThread>(`/trust/threads/${id}/`);

export const sendMessage = (threadId: string, body: string) =>
  api.post<Message>(`/trust/threads/${threadId}/messages/`, { body });

// Intake
export const uploadIntakeFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<{ intake_id: string; status: string }>('/intake/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getIntakeMessages = (params?: { status?: string }) =>
  api.get<PaginatedResponse<IntakeMessage>>('/intake/', { params });

export const getIntakeDetail = (id: string) =>
  api.get<IntakeMessage>(`/intake/${id}/`);

// Inventory
export const getInventory = (params?: { page?: number }) =>
  api.get<PaginatedResponse<InventoryItem>>('/catalog/inventory/', { params });

export const addInventoryItem = (data: Partial<InventoryItem>) =>
  api.post<InventoryItem>('/catalog/inventory/', data);

export const deleteInventoryItem = (id: string) =>
  api.delete(`/catalog/inventory/${id}/`);

export const uploadInventoryCSV = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<{ import_id: string; status: string }>('/catalog/inventory/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
