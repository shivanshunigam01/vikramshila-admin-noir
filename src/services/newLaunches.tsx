import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getLaunches = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/launches`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch launches" };
  }
};

export const createLaunch = async (formData: FormData) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/launches`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { success, message, data: {...newLaunch} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to create launch" };
  }
};

export const updateLaunch = async (id: string, formData: FormData) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/launches/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { success, message, data: {...updatedLaunch} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update launch" };
  }
};

export const deleteLaunch = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/launches/${id}`);
    return res.data; // { success, message }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to delete launch" };
  }
};
