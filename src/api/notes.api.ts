import api from "./axios";

export interface Note {
  id: string;
  content: string;
  createdById?: string;
  contactId?: string;
  leadId?: string;
  createdAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  lead?: {
    id: string;
    title?: string;
    name?: string;
    companyName?: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface NotePayload {
  content: string;
  contactId?: string;
  leadId?: string;
}

export const getNotes   = ()                               => api.get("/notes");
export const createNote = (data: NotePayload)              => api.post("/notes", data);
export const updateNote = (id: string, data: NotePayload)  => api.put(`/notes/${id}`, data);
export const deleteNote = (id: string)                     => api.delete(`/notes/${id}`);