import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// List all grievances
export const getGrievances = () => axios.get(`${API_URL}/grievances/list`);

// Update grievance status or add message
export const updateGrievance = (
  id: string,
  payload: { status?: string; message?: string }
) => axios.patch(`${API_URL}/grievances/update/${id}`, payload);

// Delete grievance
export const deleteGrievance = (id: string) =>
  axios.delete(`${API_URL}/grievances/remove/${id}`);
