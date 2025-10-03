import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getVideos = (page = 1) =>
  axios.get(`${API_URL}/videos/list?page=${page}`);

export const getVideoById = (id: string) =>
  axios.get(`${API_URL}/videos/${id}`);

export const createVideo = (data: any) =>
  axios.post(`${API_URL}/videos/create`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const updateVideo = (id: string, data: any) =>
  axios.patch(`${API_URL}/videos/update/${id}`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteVideo = (id: string) =>
  axios.delete(`${API_URL}/videos/remove/${id}`);
