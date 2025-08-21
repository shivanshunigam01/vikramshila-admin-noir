import axiosInstance from "@/api/xiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getProducts = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch products" };
  }
};
