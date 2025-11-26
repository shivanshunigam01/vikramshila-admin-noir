import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

const authHeader = () => {
  const token =
    localStorage.getItem("dse_token") || localStorage.getItem("admin_token");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};
// -----------------------------------------
// 🔹 1. Create a new planner entry (DSE)
// -----------------------------------------
export const createPlan = (data: any) =>
  axios.post(`${API_URL}/planner`, data, authHeader());

export const getPlanByDSE = (dseId: string, params?: any) =>
  axios.get(`${API_URL}/planner/dse/${dseId}`, {
    ...authHeader(),
    params,
  });

// ------------------- UPDATE STATUS ------------------
export const updatePlanStatus = (id: string, status: string, notes?: string) =>
  axios.patch(
    `${API_URL}/planner/${id}/status`,
    { status, completionNotes: notes },
    authHeader()
  );

// -------------------- ADMIN REPORTS --------------------
export const getPlannerReports = (params?: any) =>
  axios.get(`${API_URL}/planner`, {
    ...authHeader(),
    params,
  });

// ---------------- FOLLOW-UP NOTE -----------------
export const addFollowUpNote = (id: string, note: string) =>
  axios.patch(`${API_URL}/planner/${id}/follow-up`, { note }, authHeader());
