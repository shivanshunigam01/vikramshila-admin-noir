import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

// 🔹 Get all service bookings
export const getServiceBookings = async () => {
  const res = await axiosInstance.get(`${API_URL}/service-booking`);
  return res.data;
};

// 🔹 Update booking (ex: status)
export const updateServiceBooking = async (id: string, data: any) => {
  const res = await axiosInstance.put(`${API_URL}/service-booking/${id}`, data);
  return res.data;
};

// 🔹 Delete booking
export const deleteServiceBooking = async (id: string) => {
  const res = await axiosInstance.delete(`${API_URL}/service-booking/${id}`);
  return res.data;
};
