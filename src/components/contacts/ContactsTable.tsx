import { Contact } from "../../types/contact";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  deals: number;
}

type Props = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onView: (contact: Contact) => void;
};

export default function ContactsTable({ contacts, onEdit, onDelete, onView }: Props) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Phone</th>
            <th className="px-6 py-3">Company</th>
            <th className="px-6 py-3">Deals</th>
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                No contacts found.
              </td>
            </tr>
          ) : (
            contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{contact.name}</td>
                <td className="px-6 py-4 text-gray-600">{contact.email}</td>
                <td className="px-6 py-4 text-orange-500 font-medium">{contact.phone}</td>
                <td className="px-6 py-4 text-blue-600">{contact.company || "—"}</td>
                <td className="px-6 py-4 text-gray-700">{contact.deals}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => onView(contact)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(contact)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(contact.id)}
                    className="px-3 py-1 text-xs border border-red-300 text-red-500 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}