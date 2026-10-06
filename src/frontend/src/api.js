import axios from "axios";

const api = axios.create({
  baseURL: "https://medidesk1-1.onrender.com/api",
  headers: {"Content-Type": "application/json"}
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("medidesk_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
