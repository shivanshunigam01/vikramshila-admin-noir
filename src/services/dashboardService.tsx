// src/services/dashboardService.ts
import axiosInstance from "@/api/xiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getDashboardStats = async () => {
  try {
    const token = localStorage.getItem("admin_token");

    const res = await axiosInstance.get(`${API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // { success, message, data: {...} }
  } catch (error: any) {
    throw (
      error.response?.data || { message: "Failed to fetch dashboard stats" }
    );
  }
};
