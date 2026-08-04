import api from "./axios";

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  wonDealsCount?: number;
  _count?: {
    contacts: number;
    deals: number;
  };
}

export interface CompanyPayload {
  name: string;
  website?: string;
  industry?: string;
}

export const getCompanies  = ()                                    => api.get("/companies");
export const createCompany = (data: CompanyPayload)                => api.post("/companies", data);
export const updateCompany = (id: string, data: CompanyPayload)    => api.put(`/companies/${id}`, data);
export const deleteCompany = (id: string)                          => api.delete(`/companies/${id}`);