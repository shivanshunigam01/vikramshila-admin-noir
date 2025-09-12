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

// Optional: assign lead to a DSE (adjust endpoint if needed)
export const assignLead = async (leadId: string, assigneeCode: string) => {
  try {
    const res = await axiosInstance.post(
      `${API_URL}/leads/assign`,
      { leadId, assignee: assigneeCode },
      { headers: authHeader() }
    );
    return res.data; // { success, message, data? }
    
  } catch (error: any) {
    throw error?.response?.data || { message: "Lead assigned successfully" };
  }
};
