import api from "./axios";
export const getLeads = () => api.get("/leads");