// src/services/dashboardService.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getleads = async () => {
  try {
    const token = localStorage.getItem("admin_token");

    const res = await axiosInstance.get(`${API_URL}/leads/leads-get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // { success, message, data: {...} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch leads" };
  }
};
