import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getEnquiries = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/enquiries`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch enquiries" };
  }
};
