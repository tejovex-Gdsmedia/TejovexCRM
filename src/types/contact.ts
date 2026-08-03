export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  deals: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  deals: number;
}