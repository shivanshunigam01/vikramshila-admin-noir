import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

// Get all services
export const getServices = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/service-booking`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch services" };
  }
};

// Get service by ID
export const getServiceById = async (id: string) => {
  try {
    const res = await axiosInstance.get(`${API_URL}/services/${id}`);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch service" };
  }
};

// Create service
export const createService = async (payload: any) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/services`, payload);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to create service" };
  }
};

// Update service
export const updateService = async (id: string, payload: any) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/services/${id}`, payload);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update service" };
  }
};

// Delete service
export const deleteService = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/services/${id}`);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to delete service" };
  }
};
