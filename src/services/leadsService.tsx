// src/services/leadsService.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

const authHeader = () => {
  const token = localStorage.getItem("admin_token");
  return { Authorization: `Bearer ${token}` };
};

export const getleads = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/leads/leads-get`, {
      headers: authHeader(),
    });
    return res.data; // { success, data: [...] }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch leads" };
  }
};

// NEW: get single lead by ID
export const getLeadById = async (leadId: string) => {
  try {
    const res = await axiosInstance.get(
      `${API_URL}/leads/leads-get/${leadId}`,
      {
        headers: authHeader(),
      }
    );
    return res.data; // { success, data: {...} }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch lead" };
  }
};

/* =================== QUOTATION SERVICES =================== */

export type CreateQoutePayload = {
  // linkage
  leadId: string;

  // customer
  customerName: string;
  contactNumber: string;
  address?: string;
  gstNo?: string;
  panNo?: string;
  salesExecutive?: string;

  // vehicle
  model: string;
  variant?: string;
  color?: string;

  // pricing
  exShowroomPrice: number;
  rtoTax: number;
  insurance: number;
  accessories: number;
  extendedWarranty: number;
  totalOnRoadPrice: number;

  // discounts
  consumerOffer: number;
  exchangeBonus: number;
  corporateDiscount: number;
  additionalDiscount: number;
  totalDiscount: number;

  // final
  netSellingPrice: number;

  // finance
  loanAmount?: number;
  downPayment?: number;
  processingFee?: number;
  rateOfInterest?: number;
  tenure?: number;
  emi?: number;

  // misc
  deliveryPeriod?: string;
  validityPeriod?: string;
  remarks?: string;
};

// POST /leads/createQoute
export const createQoute = async (payload: CreateQoutePayload) => {
  try {
    const res = await axiosInstance.post(
      `${API_URL}/leads/createQoute`,
      payload,
      { headers: authHeader() }
    );
    return res.data; // { success, data: { _id, ... } }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create quotation" };
  }
};

// PUT /leads/updateQoutation/:quotationId
export const updateQoutation = async (
  quotationId: string,
  payload: Partial<CreateQoutePayload>
) => {
  try {
    const res = await axiosInstance.put(
      `${API_URL}/leads/updateQoutation/${quotationId}`,
      payload,
      { headers: authHeader() }
    );
    return res.data; // { success, data: { _id, ... } }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update quotation" };
  }
};

// optional, if you later auto-load an existing quote
export const getQoutationByLeadId = async (leadId: string) => {
  const res = await axiosInstance.get(
    `${API_URL}/leads/leads/qoutation-by-lead/${leadId}`,
    { headers: authHeader() }
  );
  return res.data;
};

/* =================== ASSIGN LEAD =================== */

export type AssignLeadResponse = {
  success: boolean;
  message: string;
  data?: any; // optionally type as your Lead model
};

// POST /leads/leads/assign
export const assignLead = async (leadId: string, assigneeIdOrName: string) => {
  // Send either {assigneeId} (preferred) or {assignee} if you ever pass a name/email
  const payload = /^[0-9a-fA-F]{24}$/.test(assigneeIdOrName)
    ? { leadId, assigneeId: assigneeIdOrName }
    : { leadId, assignee: assigneeIdOrName };

  const res = await axiosInstance.post(
    `${API_URL}/leads/assign`, // ✅ correct route
    payload,
    { headers: authHeader() }
  );
  return res.data; // { success, message, data: updatedLead }
};

export type DseUser = {
  _id: string;
  name: string;
  email: string;
  role: "dse";
  createdAt: string;
  updatedAt: string;
};

export const getAssignedtoDSE = async (): Promise<{
  success: boolean;
  count: number;
  data: DseUser[];
}> => {
  try {
    const res = await axiosInstance.get(`${API_URL}/leads/assignedtoDSE`, {
      headers: authHeader(),
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch DSE list" };
  }
};

// --- add at top with others ---
export const sendQoutationEmail = async (qoutationId: string, to?: string) => {
  const res = await axiosInstance.post(
    `${API_URL}/leads/qoutation/${qoutationId}/send-email`,
    { to },
    { headers: authHeader() }
  );
  return res.data; // { success, message }
};

export const sendQoutationSMS = async (
  qoutationId: string,
  to?: string,
  via: "sms" | "whatsapp" = "sms"
) => {
  const res = await axiosInstance.post(
    `${API_URL}/leads/qoutation/${qoutationId}/send-sms`,
    { to, via },
    { headers: authHeader() }
  );
  return res.data; // { success, message }
};

export const getMyAssignedLeads = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/leads/assigned-to-me`, {
      headers: authHeader(),
    });
    // backend returns either { success, data } or plain array; normalize:
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch my leads" };
  }
};

// =================== DSE update (status + note) ===================
export type DseUpdatePayload = {
  status?: "C0" | "C1" | "C2" | "C3";
  message?: string;
};

export const submitDseUpdate = async (
  leadId: string,
  payload: DseUpdatePayload
) => {
  try {
    const res = await axiosInstance.patch(
      `${API_URL}/leads/${leadId}/dse-update`,
      payload,
      { headers: authHeader() }
    );
    return res.data; // { success, message, data }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update lead" };
  }
};

/* =================== INTERNAL COSTING SERVICES (matches sheet) =================== */

export type InternalCostingPayload = {
  // linkage
  leadId: string;

  /* -------- Vehicle Information -------- */
  model: string;
  category?: string;
  variant?: string;
  fuel?: string;
  payloadSeating?: string;
  exShowroomOemTp: number; // "Ex-Showroom (OEM TP)"

  /* -------- A) Cost Adders (Dealer Expenses) -------- */
  handlingCost: number; // Dealer Handling (Logistics, PDI, Admin)
  exchangeBuybackSubsidy: number; // Exchange/Buyback Subsidy (Dealer Share)
  dealerSchemeContribution: number; // Scheme / Discount Contribution by Dealer
  fabricationCost: number; // Fabrication Cost (Dealer Share)
  marketingCost: number; // Marketing Cost (Per Vehicle Allocation)
  addersSubtotal: number; // auto: sum of A

  /* -------- B) Earnings & Supports (Reduce Net Cost) -------- */
  dealerMargin: number;
  insuranceCommission: number;
  financeCommission: number;
  oemSchemeSupport: number; // Scheme / Discount Support from OEM
  earlyBirdSchemeSupport: number;
  targetAchievementDiscount: number; // (Monthly/Monthly Slab)
  rtoEarnings: number;
  quarterlyTargetEarnings: number;
  additionalSupportsClaims: number;
  earningsSubtotal: number; // auto: sum of B

  /* -------- C) Net Dealer Cost & Profitability -------- */
  baseVehicleCost: number; // = exShowroomOemTp
  totalCostAdders: number; // = addersSubtotal
  totalEarningsSupports: number; // = earningsSubtotal
  netDealerCost: number; // = base + adders - earnings

  /* -------- Customer & Profit -------- */
  customerQuotedPrice: number;
  dealerProfitPerVehicle: number; // = quoted - netDealerCost

  // misc (optional)
  preparedBy?: string;
  remarks?: string;
};

// keep these endpoints the same as earlier
export const createInternalCosting = async (
  payload: InternalCostingPayload
) => {
  const res = await axiosInstance.post(
    `${API_URL}/leads/internal-costing`,
    payload,
    {
      headers: authHeader(),
    }
  );
  return res.data;
};

export const updateInternalCosting = async (
  costingId: string,
  payload: Partial<InternalCostingPayload>
) => {
  const res = await axiosInstance.put(
    `${API_URL}/leads/internal-costing/${costingId}`,
    payload,
    { headers: authHeader() }
  );
  return res.data;
};

export const getInternalCostingByLeadId = async (leadId: string) => {
  const res = await axiosInstance.get(
    `${API_URL}/leads/internal-costing-by-lead/${leadId}`,
    { headers: authHeader() }
  );
  return res.data;
};
