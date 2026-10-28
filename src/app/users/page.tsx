'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { UserProfile, UserRole } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import {
  UserCog,
  Plus,
  Shield,
  Phone,
  Mail,
  Home,
  Lock,
  Edit,
  Trash2,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function UserManagementPage() {
  const {
    currentUser,
    authenticatedUser,
    isAdmin,
    getActiveAdminCount,
    sheds,
    logAudit,
    users,
    addUser,
    updateUser,
    deleteUser,
    setUserPassword,
  } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isEditingSoleAdmin = editingUserId
    ? users.find((u) => u.id === editingUserId)?.role === 'owner_admin' &&
      getActiveAdminCount(editingUserId) === 0
    : false;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'manager' as UserRole,
    initial_password: '',
    assigned_shed_ids: [] as string[],
  });

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'manager',
      initial_password: '',
      assigned_shed_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      initial_password: '',
      assigned_shed_ids: user.assigned_shed_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUserId) {
      // Edit mode
      const res = updateUser(editingUserId, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        assigned_shed_ids: formData.assigned_shed_ids,
      });
      if (res.success) {
        setFormSuccess(`Updated user "${formData.full_name}" successfully.`);
      } else {
        alert(res.error || 'Failed to update user');
        return;
      }
    } else {
      // Create mode
      const res = await addUser(
        {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_active: true,
          assigned_shed_ids: formData.assigned_shed_ids,
        },
        formData.initial_password
      );
      if (res.success) {
        setFormSuccess(`Provisioned user "${formData.full_name}" with secure credentials.`);
      } else {
        alert(res.error || 'Failed to provision user');
        return;
      }
    }

    setIsModalOpen(false);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    const res = await setUserPassword(passwordModalUser.id, newPasswordInput);
    if (res.success) {
      setFormSuccess(`Password for "${passwordModalUser.full_name}" updated successfully.`);
      setPasswordModalUser(null);
      setNewPasswordInput('');
      setTimeout(() => setFormSuccess(null), 3000);
    } else {
      alert(res.error || 'Failed to set password');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    const res = deleteUser(deleteTargetUser.id);
    if (!res.success) {
      alert(res.error || 'Failed to remove user account');
      setDeleteTargetUser(null);
      return;
    }
    setDeleteTargetUser(null);
    setFormSuccess(`User "${deleteTargetUser.full_name}" removed.`);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const toggleShedAssignment = (shedId: string) => {
    setFormData((prev) => {
      const exists = prev.assigned_shed_ids.includes(shedId);
      return {
        ...prev,
        assigned_shed_ids: exists
          ? prev.assigned_shed_ids.filter((id) => id !== shedId)
          : [...prev.assigned_shed_ids, shedId],
      };
    });
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-rose-200 text-center">
        <Lock className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only the authenticated Farm Owner / Administrator has authorization to provision accounts, modify roles, and assign shed responsibilities.
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
            <span>Kasthuri Poultry Farm — User & Staff Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision manager access, enforce role permissions, and delegate shed monitoring responsibilities
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{u.full_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={u.role === 'owner_admin' ? 'purple' : 'info'}>
                    {u.role === 'owner_admin' ? 'OWNER / ADMIN' : 'MANAGER'}
                  </Badge>
                  {u.role === 'owner_admin' && getActiveAdminCount() <= 1 && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200" title="At least one active Admin must exist">
                      Protected
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {u.role === 'owner_admin'
                      ? 'Full Farm-Wide Access (All 8 Sheds)'
                      : u.assigned_shed_ids && u.assigned_shed_ids.length > 0
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPasswordModalUser(u);
                    setNewPasswordInput('');
                    setShowPassword(false);
                  }}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                  title="Set or reset account password"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Edit user"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {u.role !== 'owner_admin' && (
                  <button
                    onClick={() => setDeleteTargetUser(u)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Provision / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Edit Staff User Account' : 'Provision New Staff / Manager Account'}
        subtitle="Configure credentials and assigned shed authorization scope"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
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
                placeholder="ramesh@kasthuripoultry.com"
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
            <div className="flex items-center justify-between mb-1">
              <label className="input-label mb-0">Assigned Role</label>
              {isEditingSoleAdmin && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Protected: Sole Active Admin
                </span>
              )}
            </div>
            <select
              value={formData.role}
              disabled={isEditingSoleAdmin}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className={`input-field ${isEditingSoleAdmin ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
            >
              <option value="manager">Manager (Operational Logging & Shed Supervision)</option>
              <option value="owner_admin">Owner / Administrator (Full System Control)</option>
            </select>
            {isEditingSoleAdmin && (
              <p className="text-[11px] text-amber-600 mt-1">
                Single-Admin Safeguard: At least one active Owner/Admin account must exist at all times.
              </p>
            )}
          </div>

          {!editingUserId && (
            <div>
              <label className="input-label">Initial Account Password</label>
              <input
                type="text"
                value={formData.initial_password}
                onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                placeholder="Enter initial password (minimum 6 characters)"
                className="input-field font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The user will use this initial credential to sign in to the Android app and web portal.
              </p>
            </div>
          )}

          {formData.role === 'manager' && (
            <div>
              <label className="input-label mb-2">Delegated Physical Sheds (Select Assigned)</label>
              <div className="grid grid-cols-4 gap-2">
                {sheds.map((shed) => {
                  const isAssigned = formData.assigned_shed_ids.includes(shed.id);
                  return (
                    <button
                      key={shed.id}
                      type="button"
                      onClick={() => toggleShedAssignment(shed.id)}
                      className={`p-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        isAssigned
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {shed.code} ({shed.shed_type[0].toUpperCase()})
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Leave unselected to give access to all active farm sheds.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingUserId ? 'Save Changes' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      {deleteTargetUser && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTargetUser(null)}
          onConfirm={handleConfirmDelete}
          title="Revoke User Account"
          recordType="User"
          recordIdentifier={`${deleteTargetUser.full_name} (${deleteTargetUser.email})`}
          warningMessage={`Are you sure you want to revoke and delete ${deleteTargetUser.full_name}'s account? They will immediately lose login access.`}
        />
      )}

      {/* Set / Reset Password Modal */}
      {passwordModalUser && (
        <Modal
          isOpen={true}
          onClose={() => setPasswordModalUser(null)}
          title={`Update Credentials for ${passwordModalUser.full_name}`}
          subtitle={`Account Email: ${passwordModalUser.email}`}
        >
          <form onSubmit={handleSaveNewPassword} className="space-y-4">
            <div>
              <label className="input-label">New Account Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min 6 characters (e.g. Pass@2026)"
                  className="input-field pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Passwords are cryptographically salted and hashed. Never displayed in plain text to ensure privacy.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save New Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
