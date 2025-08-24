import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getTestimonials = async () => {
  const res = await axiosInstance.get(`${API_URL}/testimonials`);
  return res.data; // { success, data: [...] }
};

export const createTestimonial = async (testimonial: any) => {
  const res = await axiosInstance.post(`${API_URL}/testimonials`, testimonial);
  return res.data;
};

export const updateTestimonial = async (id: string, testimonial: any) => {
  const res = await axiosInstance.put(`${API_URL}/testimonials/${id}`, testimonial);
  return res.data;
};

export const deleteTestimonial = async (id: string) => {
  const res = await axiosInstance.delete(`${API_URL}/testimonials/${id}`);
  return res.data;
};

export const getTestimonialById = async (id: string) => {
  const res = await axiosInstance.get(`${API_URL}/testimonials/${id}`);
  return res.data;
};
