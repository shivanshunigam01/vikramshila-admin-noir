// src/services/bannerServices.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

// Upload a new banner image
export const uploadImage = async (formData: FormData) => {
  try {
    const token = localStorage.getItem("admin_token");

    const res = await axiosInstance.post(
      `${API_URL}/banners/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data; // { success, message, data: {...} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to upload image" };
  }
};

// Get all banner images
export const getBannerImages = async () => {
  try {
    const token = localStorage.getItem("admin_token");

    const res = await axiosInstance.get(`${API_URL}/banners/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch banner images" };
  }
};

// Delete a banner image by ID
export const deleteBannerImage = async (id: string) => {
  try {
    const token = localStorage.getItem("admin_token");

    const res = await axiosInstance.delete(`${API_URL}/banners/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // { success, message }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to delete banner image" };
  }
};
