'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { UserProfile, UserRole } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  UserCog,
  Plus,
  Search,
  ShieldAlert,
  Phone,
  Mail,
  Home,
  CheckCircle,
} from 'lucide-react';

export default function UserManagementPage() {
  const { currentUser, sheds } = useFarm();
  const isAdmin = currentUser.role === 'owner_admin';

  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: 'u-1',
      email: 'owner@balajipoultry.com',
      full_name: 'Rajesh Balaji (Owner / Admin)',
      role: 'owner_admin',
      phone: '+91 98450 11223',
      is_active: true,
      created_at: '2026-01-01',
    },
    {
      id: 'u-2',
      email: 'manager.layer@balajipoultry.com',
      full_name: 'Suresh Kumar (Shed Manager)',
      role: 'manager',
      phone: '+91 98450 44556',
      is_active: true,
      assigned_shed_ids: ['s-L1', 's-L2', 's-L5'],
      created_at: '2026-02-15',
    },
    {
      id: 'u-3',
      email: 'manager.rearing@balajipoultry.com',
      full_name: 'Amit Sharma (Grower & Chick Specialist)',
      role: 'manager',
      phone: '+91 98450 77889',
      is_active: true,
      assigned_shed_ids: ['s-G1', 's-G2', 's-C1'],
      created_at: '2026-03-01',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'manager' as UserRole,
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: 'u-' + Date.now(),
      email: formData.email,
      full_name: formData.full_name,
      role: formData.role,
      phone: formData.phone,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    };
    setUsers([...users, newUser]);
    setIsModalOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-rose-200 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only the Owner / Administrator has authority to manage user accounts and assign staff sheds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-600" />
            <span>User & Manager Account Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision manager access, enforce role permissions, and delegate shed monitoring responsibilities
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{u.full_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                </div>
                <Badge variant={u.role === 'owner_admin' ? 'purple' : 'info'}>
                  {u.role === 'owner_admin' ? 'OWNER / ADMIN' : 'MANAGER'}
                </Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {u.role === 'owner_admin'
                      ? 'Full Farm-Wide Access (All 8 Sheds)'
                      : u.assigned_shed_ids
                      ? `Assigned: ${u.assigned_shed_ids.map((id) => id.replace('s-', '')).join(', ')}`
                      : 'All Operational Sheds'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Active User
              </span>
              <span>Joined {u.created_at}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Provision Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff / Manager Account"
        subtitle="Create credentials and assign authorization scope"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh@balajipoultry.com"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450..."
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">System Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="input-field font-semibold"
            >
              <option value="manager">Shed Operations Manager</option>
              <option value="owner_admin">Owner / Full Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
