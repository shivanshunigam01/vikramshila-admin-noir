import axiosInstance from "@/api/axiosInstance";
const API_URL = import.meta.env.VITE_API_URL;

interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (data: LoginPayload) => {
  const res = await axiosInstance.post(`${API_URL}/auth/login`, data, {
    withCredentials: true, // fine; only affects cookies
  });

  // Normalize the backend shape to { token, user }
  const d = res?.data ?? {};
  const token = d?.data?.token ?? d?.token ?? null;
  const user = d?.data?.user ?? d?.user ?? null;

  return { token, user, raw: d };
};
