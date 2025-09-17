import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

const authHeader = () => {
  const token = localStorage.getItem("admin_token");
  return { Authorization: `Bearer ${token}` };
};

export const getEnquiries = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/enquiries/list`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch enquiries" };
  }
};

export const assignEnquiry = async (
  enquiryId: string,
  assigneeIdOrName: string
) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(assigneeIdOrName);

  const payload: Record<string, string> = { enquiryId };

  if (isObjectId) {
    payload.assigneeId = assigneeIdOrName;
  }
  // Always send assignee (name/email/id for traceability)
  payload.assignee = assigneeIdOrName;

  const res = await axiosInstance.post(`${API_URL}/enquiries/assign`, payload, {
    headers: authHeader(),
  });

  return res.data; // { success, message, data: updatedEnquiry }
};

/** Get enquiries assigned to the logged-in user */
export const getMyAssignedEnquiries = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/enquiries/assigned-to-me`, {
      headers: authHeader(),
    });
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch my enquiries" };
  }
};
export const updateEnquiryByDse = async (
  enquiryId: string,
  body: { status?: "C0" | "C1" | "C2" | "C3"; message?: string }
) => {
  try {
    const res = await axiosInstance.patch(
      `${API_URL}/enquiries/${enquiryId}/dse-update`, // ✅ correct path + method
      body,
      { headers: authHeader() }
    );
    return res.data; // { success, data }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update enquiry" };
  }
};
