import React, { useState } from 'react';
import { 
  Users2, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Lock,
  UserCog
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { UserRole } from '../../types';
import { toBengaliNumber } from '../../utils/bengaliUtils';

export const UserManagementView: React.FC = () => {
  const { users, addUser, toggleUserStatus } = useSomiti();
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('field_officer');

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'প্রধান প্রশাসক (Super Admin)', bg: 'bg-purple-100 text-purple-800' };
      case 'president':
        return { label: 'সভাপতি (President)', bg: 'bg-indigo-100 text-indigo-800' };
      case 'secretary':
        return { label: 'সাধারণ সম্পাদক (Secretary)', bg: 'bg-blue-100 text-blue-800' };
      case 'cashier':
        return { label: 'ক্যাশিয়ার (Cashier)', bg: 'bg-emerald-100 text-emerald-800' };
      case 'manager':
        return { label: 'ম্যানেজার (Manager)', bg: 'bg-teal-100 text-teal-800' };
      case 'field_officer':
      default:
        return { label: 'মাঠকর্মী / কালেক্টর (Field Officer)', bg: 'bg-slate-100 text-slate-800' };
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      status: 'active',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    });

    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              অফিস ইউজার ও রোল পারমিশন ব্যবস্থাপনা (User Management)
            </h2>
            <p className="text-xs text-slate-500">
              মোট নিবন্ধিত ইউজার: {toBengaliNumber(users.length)} জন
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন কর্মকর্তা / ইউজার যোগ</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const roleBadge = getRoleBadge(user.role);
          return (
            <div
              key={user.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 relative"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {user.status === 'active' ? 'সক্রিয় অ্যাকাউন্ট' : 'স্থগিত / বন্ধ'}
                </span>

                <button
                  onClick={() => toggleUserStatus(user.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {user.status === 'active' ? 'স্থগিত করুন' : 'সক্রিয় করুন'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">নতুন ইউজার অ্যাকাউন্ট তৈরি</h3>
              <button onClick={() => setShowAddModal(false)} className="text-indigo-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কর্মকর্তার পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইমেইল এড্রেস <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@bondhusomiti.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইউজার রোল ও পারমিশন লেভেল <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  <option value="president">সভাপতি (President - সম্পূর্ণ অনুমোদন)</option>
                  <option value="secretary">সাধারণ সম্পাদক (Secretary - অ্যাডমিন)</option>
                  <option value="cashier">ক্যাশিয়ার (Cashier - জমা/উত্তোলন)</option>
                  <option value="manager">ম্যানেজার (Manager - সার্বিক পরিচালনা)</option>
                  <option value="field_officer">মাঠকর্মী (Field Officer - কিস্তি সংগ্রহ)</option>
                  <option value="admin">সুপার এডমিন (Super Admin)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-800"
                >
                  ইউজার যুক্ত করুন ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
