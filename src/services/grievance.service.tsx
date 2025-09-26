import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getGrievances = () => axios.get(`${API_URL}/grievances/list`);
export const inProgressGrievance = (id: string) =>
  axios.patch(`${API_URL}/grievances/in-progress/${id}`);
export const resolveGrievance = (id: string) =>
  axios.patch(`${API_URL}/grievances/resolve/${id}`);
export const deleteGrievance = (id: string) =>
  axios.delete(`${API_URL}/grievances/remove/${id}`);
