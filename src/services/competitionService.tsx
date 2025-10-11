import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const getCompetitionProducts = (params?: any) =>
  axios.get(`${API_URL}/competition-products/list`, { params });

export const createCompetitionProduct = (data: any) =>
  axios.post(`${API_URL}/competition-products/create`, data);

export const updateCompetitionProduct = (id: string, data: any) =>
  axios.put(`${API_URL}/competition-products/update/${id}`, data);

export const deleteCompetitionProduct = (id: string) =>
  axios.delete(`${API_URL}/competition-products/delete/${id}`);

// ✅ NEW
export const competitionCompareFilter = (filters: any) => {
  return axios.post(`${API_URL}/competition-products/compare-filter`, filters);
};
