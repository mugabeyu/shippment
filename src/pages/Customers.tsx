import React, { useState } from 'react';
import { useStore, genId, type Customer } from '../store';
import { Plus, Search, Phone, Mail, MapPin, X, Edit2, Trash2 } from 'lucide-react';

const EMPTY = {
  id: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  totalKgSent: 0
};

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Customer>(EMPTY);

  const openNew = () => {
    setDraft(EMPTY);
    setIsModalOpen(true);
  };
  const openEdit = (customer: Customer) => {
    setDraft(customer);
    setIsModalOpen(true);
  };
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      updateCustomer(draft);
    } else {
      addCustomer({ ...draft, id: genId(), totalKgSent: 0 });
    }
    setIsModalOpen(false);
  };
  const newCustomer = draft;
  const setNewCustomer = setDraft;
  const filteredCustomers = customers.filter(
    (c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
          
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors" />
            
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredCustomers.map((customer) =>
          <div
            key={customer.id}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {customer.name}
                  </h3>
                  <div className="text-sm text-yellow-500 font-medium mt-1">
                    Loyalty: {customer.totalKgSent} kg sent
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                  onClick={() => openEdit(customer)}
                  aria-label={`Edit ${customer.name}`}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                  
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                  onClick={() => deleteCustomer(customer.id)}
                  aria-label={`Delete ${customer.name}`}
                  className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
                  
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-zinc-500" />
                  {customer.phone}
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-zinc-500" />
                  {customer.email || 'No email provided'}
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-3 mt-0.5 text-zinc-500 shrink-0" />
                  <span className="line-clamp-2">{customer.address}</span>
                </div>
              </div>

              {customer.notes &&
            <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Notes:</span>{' '}
                  {customer.notes}
                </div>
            }
            </div>
          )}
        </div>

        {filteredCustomers.length === 0 &&
        <div className="p-8 text-center text-zinc-500">
            No customers found.
          </div>
        }
      </div>

      {isModalOpen &&
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {draft.id ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
              onClick={() => setIsModalOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                required
                type="text"
                value={newCustomer.name}
                onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  name: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Phone Number (Loyalty ID)
                </label>
                <input
                required
                type="tel"
                value={newCustomer.phone}
                onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  phone: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                type="email"
                value={newCustomer.email}
                onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  email: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Address
                </label>
                <textarea
                rows={2}
                value={newCustomer.address}
                onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  address: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Notes
                </label>
                <textarea
                rows={2}
                value={newCustomer.notes}
                onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  notes: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none" />
              
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
                
                  {draft.id ? 'Save Changes' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}