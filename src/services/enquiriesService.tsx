// src/services/enquiriesService.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL as string;

const authHeader = () => {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("dse_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** ----- Types (optional but handy) ----- */
export type EnquiryStatus = "C0" | "C1" | "C2" | "C3";

export type DseUpdate = {
  message: string;
  status: string;
  createdAt: string;
};

export type EnquiryDTO = {
  _id: string;
  fullName?: string;
  customerName?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  mobileNumber?: string;
  phone?: string;
  userPhone?: string;
  productTitle?: string;
  product?: string;
  panNumber?: string;
  aadharNumber?: string;
  status?: EnquiryStatus | string;
  createdAt?: string;
  assignedTo?: string;
  assignedToId?: { _id?: string; name?: string };
  dseUpdates?: DseUpdate[];
  // ...any other fields your backend returns
};

type ApiOk<T = any> = { success: boolean; message?: string; data: T };

/** ------------------------------------------------------------------ */
/** List all enquiries (admin)  -> GET /enquiries/list                  */
/** ------------------------------------------------------------------ */
export const getEnquiries = async (): Promise<ApiOk<EnquiryDTO[]>> => {
  try {
    const res = await axiosInstance.get(`${API_URL}/quick-enquiries`, {
      headers: authHeader(),
    });
    return res.data;
  } catch (error: any) {
    throw (
      error?.response?.data || { message: "Failed to fetch quick enquiries" }
    );
  }
};

/** ------------------------------------------------------------------ */
/** Enquiries assigned to logged-in DSE -> GET /enquiries/assigned-to-me */
/** ------------------------------------------------------------------ */
export const getMyAssignedEnquiries = async (): Promise<
  ApiOk<EnquiryDTO[]>
> => {
  try {
    const res = await axiosInstance.get(`${API_URL}/enquiries/assigned-to-me`, {
      headers: authHeader(),
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch my enquiries" };
  }
};

/** ------------------------------------------------------------------ */
/** Get single enquiry (if you have it) -> GET /enquiries/:id           */
/** Safe to keep—use when you add a detail view that refetches by id.   */
/** ------------------------------------------------------------------ */
export const getEnquiryById = async (
  enquiryId: string
): Promise<ApiOk<EnquiryDTO>> => {
  try {
    const res = await axiosInstance.get(`${API_URL}/enquiries/${enquiryId}`, {
      headers: authHeader(),
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch enquiry" };
  }
};

/** ------------------------------------------------------------------ */
/** Assign enquiry -> POST /enquiries/assign                            */
/** Body you showed: { enquiryId, assigneeId?, assignee }               */
/** ------------------------------------------------------------------ */
export const assignEnquiry = async (
  enquiryId: string,
  assigneeIdOrName: string
): Promise<ApiOk<EnquiryDTO>> => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(assigneeIdOrName);
  const payload: Record<string, string> = {
    enquiryId,
    assignee: assigneeIdOrName,
  };
  if (isObjectId) payload.assigneeId = assigneeIdOrName;

  try {
    const res = await axiosInstance.post(
      `${API_URL}/enquiries/assign`,
      payload,
      {
        headers: authHeader(),
      }
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to assign enquiry" };
  }
};

/** ------------------------------------------------------------------ */
/** DSE update (status/message) -> PATCH /enquiries/:id/dse-update      */
/** ------------------------------------------------------------------ */
export const updateEnquiryByDse = async (
  enquiryId: string,
  body: { status?: EnquiryStatus; message?: string }
): Promise<ApiOk<EnquiryDTO>> => {
  try {
    const res = await axiosInstance.patch(
      `${API_URL}/enquiries/${enquiryId}/dse-update`,
      body,
      { headers: authHeader() }
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update enquiry" };
  }
};

/** ------------------------------------------------------------------ */
/** (Optional) Create enquiry -> POST /enquiries                        */
/** Keep if your admin can create from panel.                           */
/** ------------------------------------------------------------------ */
export const createEnquiry = async (
  payload: Partial<EnquiryDTO> & Record<string, any>
): Promise<ApiOk<EnquiryDTO>> => {
  try {
    const res = await axiosInstance.post(`${API_URL}/enquiries`, payload, {
      headers: authHeader(),
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create enquiry" };
  }
};

/** ------------------------------------------------------------------ */
/** (Optional) Update enquiry -> PUT /enquiries/:id                     */
/** ------------------------------------------------------------------ */
export const updateEnquiry = async (
  enquiryId: string,
  payload: Partial<EnquiryDTO> & Record<string, any>
): Promise<ApiOk<EnquiryDTO>> => {
  try {
    const res = await axiosInstance.put(
      `${API_URL}/enquiries/${enquiryId}`,
      payload,
      {
        headers: authHeader(),
      }
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update enquiry" };
  }
};
