import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;


export const getSchemes = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/schemes`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch schemes" };
  }
};

export const createScheme = async (formData: FormData) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/schemes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { success, message, data: {...newScheme} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to create scheme" };
  }
};

export const updateScheme = async (id: string, formData: FormData) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/schemes/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { success, message, data: {...updatedScheme} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update scheme" };
  }
};

export const deleteScheme = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/schemes/${id}`);
    return res.data; // { success, message }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to delete scheme" };
  }
};
