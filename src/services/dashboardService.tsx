// src/services/dashboardService.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getDashboardStats = async () => {
  try {
    const token = localStorage.getItem("admin_token");

    // 🔹 Call both APIs in parallel
    const [businessRes, visitorRes] = await Promise.all([
      axiosInstance.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axiosInstance.get(`${API_URL}/visits/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // 🔹 Merge data cleanly
    return {
      success: true,
      data: {
        ...businessRes.data.data, // products, schemes, enquiries etc.
        ...visitorRes.data, // todayVisits, totalVisits, uniqueVisitors
      },
    };
  } catch (error: any) {
    throw (
      error.response?.data || {
        message: "Failed to fetch dashboard stats",
      }
    );
  }
};
