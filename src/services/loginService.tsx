import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (data: LoginPayload) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/auth/login`, data, {
      withCredentials: true, // include cookies if backend sends them
    });
    return res.data; // your backend RESP.ok format
  } catch (error: any) {
    throw error.response?.data || { message: "Login failed" };
  }
};
