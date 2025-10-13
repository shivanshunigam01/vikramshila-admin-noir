import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

// 🔹 1. List all competition products
export const getCompetitionProducts = (params?: any) =>
  axios.get(`${API_URL}/competition-products/list`, { params });

// 🔹 2. Create a new competition product
export const createCompetitionProduct = (data: any) =>
  axios.post(`${API_URL}/competition-products/create`, data);

// 🔹 3. Update an existing competition product
export const updateCompetitionProduct = (id: string, data: any) =>
  axios.put(`${API_URL}/competition-products/update/${id}`, data);

// 🔹 4. Delete a competition product
export const deleteCompetitionProduct = (id: string) =>
  axios.delete(`${API_URL}/competition-products/delete/${id}`);

// 🔹 5. Compare Tata + Competitor products (NEW unified endpoint)
export const competitionCompareFilter = async (filters: any) => {
  const res = await axios.post(
    `${API_URL}/competition-products/filter`,
    filters
  );
  return res.data; // ✅ now returns { success, totalReal, data: { real, competitors } }
};

// 🔹 6. Fetch all available applications (used in dropdown)
export const applicationFind = (payload: any) => {
  return axios.get(`${API_URL}/products/applications/list`, {
    params: payload,
  });
};
