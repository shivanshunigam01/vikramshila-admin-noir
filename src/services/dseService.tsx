import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getDSEList = async () => {
  const res = await axios.get(`${API_URL}/auth/get-dse`);
  return res.data.items; // only items array
};

export const getDSELocation = async (dseId) => {
  const res = await axios.get(`${API_URL}/tracking/latest/${dseId}`);
  return res.data;
};
