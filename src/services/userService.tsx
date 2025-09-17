import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export type CreateUserPayload = {
  username: string;
  password: string;
  name: string;
  email: string;
  role: "admin" | "dsm" | "branch_admin" | "dse";
  branch?: string; // required for dsm/branch_admin/dse; ignored for admin
};

export type UserRecord = {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "dsm" | "branch_admin" | "dse";
  branch?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // allow extra fields safely
  [key: string]: any;
};

// Generic API response type
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function createStaffUser(data: CreateUserPayload) {
  try {
    // New separate API you set up for staff creation
    const res = await axiosInstance.post(`${API_URL}/auth/users`, data);
    return res.data; // { success, message, data }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create user" };
  }
}

/** (you already had this style; keeping it here for convenience) */
export async function login(data: { email: string; password: string }) {
  try {
    const res = await axiosInstance.post(`${API_URL}/auth/login`, data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Login failed" };
  }
}

export async function getAllUsers(params?: {
  q?: string;
  role?: "admin" | "dsm" | "branch_admin" | "dse" | "all";
  branch?: string | "all";
}): Promise<ApiResponse<UserRecord[]>> {
  try {
    const res = await axiosInstance.get<ApiResponse<UserRecord[]>>(
      `${API_URL}/auth/getAllUsers`,
      { params }
    );

    // Normalize possible backend variations
    const payload = res.data;
    const rows: UserRecord[] = Array.isArray(payload)
      ? (payload as any)
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray((payload as any)?.users)
      ? (payload as any).users
      : [];

    return { success: true, data: rows, message: payload?.message };
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch users" };
  }
}

export async function deleteUserById(userId: string) {
  try {
    const res = await axiosInstance.delete(`${API_URL}/auth/users/${userId}`);
    return res.data; // { success, data: { id }, message }
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete user" };
  }
}
