import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const getDSEList = async () => {
  const res = await axios.get(`${API_BASE}/auth/get-dse`);
  return res.data.items; // only items array
};

export const getDSELocation = async (dseId) => {
  const res = await axios.get(`${API_BASE}/tracking/latest/${dseId}`);
  return res.data;
};
