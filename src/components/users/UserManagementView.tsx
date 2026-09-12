import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin,
  Target,
  Trash2,
  UserCog,
  Search,
  CheckCircle2,
  Edit3,
  Users,
  Building,
  UserCheck,
  Award,
  Filter,
  X,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole, AppUser, Member } from '../../types';
import { toBengaliNumber, formatCurrency } from '../../utils/bengaliUtils';

export const UserManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, currentUser, members } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'committee' | 'manager' | 'field_officer' | 'members'>('all');

  // Add User Form State
  const [creationMode, setCreationMode] = useState<'member' | 'direct'>('member');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('field_officer');
  const [roleTitle, setRoleTitle] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Edit User Form State
  const [editRole, setEditRole] = useState<UserRole>('field_officer');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editTarget, setEditTarget] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  const getDefaultRoleTitle = (r: UserRole): string => {
    switch (r) {
      case 'admin':
        return isBn ? 'সুপার এডমিন' : 'Super Admin';
      case 'president':
        return isBn ? 'সভাপতি' : 'President';
      case 'secretary':
        return isBn ? 'সাধারণ সম্পাদক' : 'General Secretary';
      case 'cashier':
        return isBn ? 'ক্যাশিয়ার' : 'Cashier';
      case 'manager':
        return isBn ? 'ম্যানেজার' : 'Manager';
      case 'field_officer':
      default:
        return isBn ? 'মাঠকর্মী / কালেক্টর' : 'Field Officer';
    }
  };

  const getRoleBadge = (r: UserRole, customTitle?: string) => {
    switch (r) {
      case 'admin':
        return { 
          label: customTitle || (isBn ? 'প্রধান প্রশাসক (সুপার এডমিন)' : 'Super Admin'), 
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-500'
        };
      case 'president':
        return { 
          label: customTitle || (isBn ? 'সভাপতি (প্রেসিডেন্ট)' : 'President'), 
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500'
        };
      case 'secretary':
        return { 
          label: customTitle || (isBn ? 'সাধারণ সম্পাদক (সেক্রেটারি)' : 'General Secretary'), 
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'cashier':
        return { 
          label: customTitle || (isBn ? 'ক্যাশিয়ার (হিসাবরক্ষক)' : 'Cashier'), 
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'manager':
        return { 
          label: customTitle || (isBn ? 'ম্যানেজার (ব্যবস্থাপক)' : 'Manager'), 
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          dot: 'bg-teal-500'
        };
      case 'field_officer':
      default:
        return { 
          label: customTitle || (isBn ? 'মাঠকর্মী / কালেক্টর' : 'Field Officer'), 
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500'
        };
    }
  };

  // Filter members for selection in Add Modal
  const filteredEligibleMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8);
    const q = memberSearch.toLowerCase().trim();
    return members.filter(m => 
      m.name?.toLowerCase().includes(q) ||
      m.nameEn?.toLowerCase().includes(q) ||
      m.memberNo?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.nid?.includes(q)
    ).slice(0, 8);
  }, [members, memberSearch]);

  // Handle selecting an existing member
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setName(member.name);
    setPhone(member.phone || '');
    // Generate an email if member doesn't have one
    const safeMemberNo = member.memberNo ? member.memberNo.toLowerCase().replace(/[^a-z0-9]/g, '') : member.id;
    setEmail(member.email || `member_${safeMemberNo}@somiti.local`);
    setAvatarUrl(member.photoUrl || '');
    setRoleTitle(getDefaultRoleTitle(role));
    setAssignedArea(member.presentAddress || (isBn ? 'প্রধান কার্যালয়' : 'Head Office'));
  };

  // Reset Add Form
  const resetAddForm = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setName('');
    setEmail('');
    setPhone('');
    setRole('field_officer');
    setRoleTitle('');
    setAssignedArea('');
    setDailyTarget(0);
    setAvatarUrl('');
    setCreationMode('member');
  };

  // Handle Add User Form Submission
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const finalRoleTitle = roleTitle.trim() || getDefaultRoleTitle(role);
    const finalAvatar = avatarUrl.trim() || (selectedMember?.photoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`);

    addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      roleTitle: finalRoleTitle,
      assignedArea: assignedArea.trim() || (isBn ? 'প্রধান কার্যালয়' : 'Head Office'),
      dailyTarget: Number(dailyTarget) || 0,
      collectedToday: 0,
      status: 'active',
      avatarUrl: finalAvatar,
      memberId: selectedMember ? selectedMember.id : undefined,
      memberNo: selectedMember ? selectedMember.memberNo : undefined,
    });

    setShowAddModal(false);
    resetAddForm();
  };

  // Open Edit Modal
  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditRoleTitle(user.roleTitle || getDefaultRoleTitle(user.role));
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditEmail(user.email);
    setEditArea(user.assignedArea || '');
    setEditTarget(user.dailyTarget || 0);
    setEditStatus(user.status);
  };

  // Handle Edit User Form Submission
  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      roleTitle: editRoleTitle.trim() || getDefaultRoleTitle(editRole),
      assignedArea: editArea.trim(),
      dailyTarget: Number(editTarget) || 0,
      status: editStatus,
    });

    setEditingUser(null);
  };

  const confirmDelete = (userId: string) => {
    deleteUser(userId);
    setUserToDelete(null);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q) ||
        user.roleTitle?.toLowerCase().includes(q) ||
        user.assignedArea?.toLowerCase().includes(q) ||
        (user.memberNo && user.memberNo.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter === 'all') return true;
      if (roleFilter === 'admin') return user.role === 'admin';
      if (roleFilter === 'committee') return user.role === 'president' || user.role === 'secretary' || user.role === 'admin';
      if (roleFilter === 'manager') return user.role === 'manager' || user.role === 'cashier';
      if (roleFilter === 'field_officer') return user.role === 'field_officer';
      if (roleFilter === 'members') return !!user.memberId;

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const committeeCount = users.filter(u => ['admin', 'president', 'secretary', 'cashier'].includes(u.role)).length;
    const managersCount = users.filter(u => u.role === 'manager').length;
    const fieldOfficersCount = users.filter(u => u.role === 'field_officer').length;
    const linkedMembersCount = users.filter(u => !!u.memberId).length;
    return { total, committeeCount, managersCount, fieldOfficersCount, linkedMembersCount };
  }, [users]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl ring-4 ring-indigo-50/50">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isBn ? 'অফিস স্টাফ ও ইউজার ব্যবস্থাপনা' : 'Office Staff & User Management'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn 
                  ? `মোট নিবন্ধিত কর্মকর্তা ও ইউজার: ${toBengaliNumber(stats.total)} জন (${toBengaliNumber(stats.linkedMembersCount)} জন সমিতি সদস্য থেকে নিযুক্ত)`
                  : `Total registered staff & users: ${stats.total} (${stats.linkedMembersCount} appointed from somiti members)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                resetAddForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isBn ? 'কর্মকর্তা / ইউজার যোগ করুন' : 'Add / Assign Officer'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">
              {isBn ? 'মোট কর্মকর্তা' : 'Total Staff'}
            </div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5">
              {isBn ? toBengaliNumber(stats.total) : stats.total} <span className="text-xs font-normal text-slate-500">{isBn ? 'জন' : ''}</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/60">
            <div className="text-[11px] font-semibold text-indigo-700">
              {isBn ? 'প্রশাসন ও পরিচালনা কমিটি' : 'Executive & Committee'}
            </div>
            <div className="text-lg font-extrabold text-indigo-900 mt-0.5">
              {isBn ? toBengaliNumber(stats.committeeCount) : stats.committeeCount} <span className="text-xs font-normal text-indigo-600">{isBn ? 'জন' : ''}</span>
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60">
            <div className="text-[11px] font-semibold text-amber-700">
              {isBn ? 'মাঠকর্মী ও কালেক্টর' : 'Field Officers'}
            </div>
            <div className="text-lg font-extrabold text-amber-900 mt-0.5">
              {isBn ? toBengaliNumber(stats.fieldOfficersCount) : stats.fieldOfficersCount} <span className="text-xs font-normal text-amber-600">{isBn ? 'জন' : ''}</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/60">
            <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              <span>{isBn ? 'সদস্য থেকে নিযুক্ত' : 'From Somiti Members'}</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
              {isBn ? toBengaliNumber(stats.linkedMembersCount) : stats.linkedMembersCount} <span className="text-xs font-normal text-emerald-600">{isBn ? 'জন' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isBn ? 'নাম, পদবী, ইমেইল, ফোন বা সদস্য নম্বর দিয়ে খুঁজুন...' : 'Search by name, role, email, phone or member no...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              roleFilter === 'all' 
                ? 'bg-indigo-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'সকল' : 'All'} ({isBn ? toBengaliNumber(users.length) : users.length})
          </button>

          <button
            onClick={() => setRoleFilter('committee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              roleFilter === 'committee' 
                ? 'bg-indigo-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'কমিটি ও প্রশাসন' : 'Committee & Admin'}
          </button>

          <button
            onClick={() => setRoleFilter('manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              roleFilter === 'manager' 
                ? 'bg-indigo-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'ম্যানেজার ও ক্যাশিয়ার' : 'Managers & Cashiers'}
          </button>

          <button
            onClick={() => setRoleFilter('field_officer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              roleFilter === 'field_officer' 
                ? 'bg-indigo-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'মাঠকর্মী' : 'Field Officers'}
          </button>

          <button
            onClick={() => setRoleFilter('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              roleFilter === 'members' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isBn ? 'সদস্য থেকে নিযুক্ত' : 'From Members'} ({isBn ? toBengaliNumber(stats.linkedMembersCount) : stats.linkedMembersCount})
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">
            {isBn ? 'কোনো কর্মকর্তা বা ইউজার পাওয়া যায়নি' : 'No staff or user found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? (isBn ? 'আপনার অনুসন্ধানের সাথে মিল রয়েছে এমন কোনো রেকর্ড পাওয়া যায়নি।' : 'No records match your search criteria.')
              : (isBn ? 'এখনই "কর্মকর্তা / ইউজার যোগ করুন" বাটনে ক্লিক করে নতুন কর্মকর্তা নিযুক্ত করুন।' : 'Click "Add / Assign Officer" button to register new staff.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const roleBadge = getRoleBadge(user.role, user.roleTitle);
            const isMe = user.id === currentUser?.id || user.email === currentUser?.email;

            return (
              <div
                key={user.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 relative hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header with Avatar & Details */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                          alt={user.name}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">
                            {user.name}
                          </h4>
                          {isMe && (
                            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-bold">
                              {isBn ? 'আপনি' : 'You'}
                            </span>
                          )}
                        </div>

                        {/* Role Badge */}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`} />
                            {roleBadge.label}
                          </span>
                        </div>

                        {/* Linked Member Badge */}
                        {user.memberNo && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                              <LinkIcon className="w-2.5 h-2.5" />
                              <span>{isBn ? `সদস্য #${toBengaliNumber(user.memberNo)}` : `Member #${user.memberNo}`}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        title={isBn ? 'পদবী ও তথ্য পরিবর্তন' : 'Edit Role & Info'}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isMe && (
                        <button
                          onClick={() => setUserToDelete(user.id)}
                          title={isBn ? 'ইউজার মুছুন' : 'Delete User'}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Information Rows */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-700">{user.email}</span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{isBn ? toBengaliNumber(user.phone) : user.phone}</span>
                      </div>
                    )}

                    {user.assignedArea && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">
                          <span className="text-slate-400">{isBn ? 'এলাকা:' : 'Area:'}</span> {user.assignedArea}
                        </span>
                      </div>
                    )}

                    {user.dailyTarget ? (
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          <span className="text-slate-400 font-normal">{isBn ? 'দৈনিক লক্ষ্যমাত্রা:' : 'Daily Target:'}</span> {formatCurrency(user.dailyTarget, isBn)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Status Toggle Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {user.status === 'active' 
                      ? (isBn ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Account') 
                      : (isBn ? 'স্থগিত / বন্ধ' : 'Suspended / Inactive')}
                  </span>

                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`text-xs font-bold transition-colors ${
                      user.status === 'active' 
                        ? 'text-rose-600 hover:text-rose-800' 
                        : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    {user.status === 'active' 
                      ? (isBn ? 'স্থগিত করুন' : 'Suspend') 
                      : (isBn ? 'সক্রিয় করুন' : 'Activate')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Add Officer / User Modal with Member Selection Option */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-800 rounded-lg">
                  <UserPlus className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {isBn ? 'নতুন কর্মকর্তা / ইউজার নিয়োগ ফরম' : 'Assign New Officer / Staff'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {isBn ? 'বিদ্যমান সদস্য থেকে নির্বাচন করুন অথবা সরাসরি স্টাফ যোগ করুন' : 'Select from existing members or enter direct staff details'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }} 
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode('member');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    creationMode === 'member'
                      ? 'bg-white text-indigo-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{isBn ? 'বিদ্যমান সদস্য থেকে নির্বাচন' : 'Select from Existing Member'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreationMode('direct');
                    setSelectedMember(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    creationMode === 'direct'
                      ? 'bg-white text-indigo-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>{isBn ? 'সরাসরি নতুন স্টাফ এন্ট্রি' : 'Direct New Staff Entry'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Option 1: Existing Member Selection */}
              {creationMode === 'member' && (
                <div className="space-y-3 pb-4 border-b border-slate-200">
                  <label className="block text-xs font-bold text-slate-800">
                    {isBn ? '১. সমিতির বিদ্যমান সদস্য নির্বাচন করুন' : '1. Select Existing Somiti Member'} <span className="text-rose-500">*</span>
                  </label>

                  {/* Search Input for Members */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={isBn ? 'সদস্যের নাম, সদস্য নং (#), মোবাইল বা এনআইডি দিয়ে খুঁজুন...' : 'Search member by name, member no, phone or NID...'}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Quick Select Member Dropdown List */}
                  {!selectedMember && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                      {filteredEligibleMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          {isBn ? 'কোনো সদস্য পাওয়া যায়নি।' : 'No members found.'}
                        </div>
                      ) : (
                        filteredEligibleMembers.map((m) => {
                          const isAlreadyUser = users.some(u => u.memberId === m.id || u.phone === m.phone);
                          return (
                            <div
                              key={m.id}
                              onClick={() => handleSelectMember(m)}
                              className="p-2.5 flex items-center justify-between hover:bg-indigo-50/60 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={m.photoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                                  alt={m.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>{m.name}</span>
                                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 rounded">
                                      #{isBn ? toBengaliNumber(m.memberNo) : m.memberNo}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {isBn ? 'মোবাইল:' : 'Phone:'} {isBn ? toBengaliNumber(m.phone) : m.phone}
                                  </div>
                                </div>
                              </div>

                              <div>
                                {isAlreadyUser ? (
                                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                                    {isBn ? 'ইতিমধ্যে পদবীপ্রাপ্ত' : 'Already Assigned'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-indigo-700 hover:underline">
                                    {isBn ? 'নির্বাচন করুন →' : 'Select →'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Selected Member Preview Card */}
                  {selectedMember && (
                    <div className="bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedMember.photoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                          alt={selectedMember.name}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-indigo-950">{selectedMember.name}</h4>
                            <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded text-[10px] font-mono font-bold">
                              #{isBn ? toBengaliNumber(selectedMember.memberNo) : selectedMember.memberNo}
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-800 mt-0.5">
                            {isBn ? 'মোবাইল:' : 'Phone:'} {isBn ? toBengaliNumber(selectedMember.phone) : selectedMember.phone} • {selectedMember.presentAddress || (isBn ? 'ঠিকানা নেই' : 'No address')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline shrink-0"
                      >
                        {isBn ? 'পরিবর্তন করুন' : 'Change'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Role & Permissions Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  {isBn ? '২. কর্মকর্তা পদবী ও পারমিশন রোল নির্ধারণ' : '2. Assign Official Role & Permissions'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'admin' ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => {
                        setRole('admin');
                        setRoleTitle(getDefaultRoleTitle('admin'));
                      }}
                      className="mt-0.5 text-purple-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-purple-950">
                        {isBn ? 'সুপার এডমিন (Super Admin)' : 'Super Admin'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'সকল সেটিংস, ডিলিট ও সার্বিক নিয়ন্ত্রণ' : 'Full access to settings & operations'}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'president' ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="president"
                      checked={role === 'president'}
                      onChange={() => {
                        setRole('president');
                        setRoleTitle(getDefaultRoleTitle('president'));
                      }}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-indigo-950">
                        {isBn ? 'সভাপতি (President)' : 'President'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'কমিটি প্রধান, চূড়ান্ত অনুমোদন ও নীতি নির্ধারণ' : 'Board head & top approvals'}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'secretary' ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="secretary"
                      checked={role === 'secretary'}
                      onChange={() => {
                        setRole('secretary');
                        setRoleTitle(getDefaultRoleTitle('secretary'));
                      }}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-blue-950">
                        {isBn ? 'সাধারণ সম্পাদক (Secretary)' : 'General Secretary'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'প্রশাসনিক কাজ ও সাধারণ সদস্য ব্যবস্থাপনা' : 'Executive administration & operations'}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'cashier' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="cashier"
                      checked={role === 'cashier'}
                      onChange={() => {
                        setRole('cashier');
                        setRoleTitle(getDefaultRoleTitle('cashier'));
                      }}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        {isBn ? 'ক্যাশিয়ার (Cashier)' : 'Cashier'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'জমা/উত্তোলন, ভাউচার ও ক্যাশ হিসাব' : 'Cash vault, deposits & vouchers'}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'manager' ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="manager"
                      checked={role === 'manager'}
                      onChange={() => {
                        setRole('manager');
                        setRoleTitle(getDefaultRoleTitle('manager'));
                      }}
                      className="mt-0.5 text-teal-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-teal-950">
                        {isBn ? 'ম্যানেজার (Manager)' : 'Branch Manager'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'শাখা পরিচালনা ও কর্মকর্তা তদারকি' : 'Branch operations & supervision'}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    role === 'field_officer' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="field_officer"
                      checked={role === 'field_officer'}
                      onChange={() => {
                        setRole('field_officer');
                        setRoleTitle(getDefaultRoleTitle('field_officer'));
                      }}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        {isBn ? 'মাঠকর্মী / কালেক্টর (Field Officer)' : 'Field Officer'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isBn ? 'মাঠপর্যায়ে কিস্তি ও সঞ্চয় সংগ্রহ' : 'Field installment collection'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'কর্মকর্তার নাম' : 'Officer Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isBn ? 'যেমন: মোঃ কামরুল হাসান' : 'e.g. John Doe'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'ইমেইল এড্রেস (লগইন আইডি)' : 'Email Address (Login ID)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="user@somiti.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'দায়িত্বপ্রাপ্ত এলাকা / শাখা' : 'Assigned Area / Branch'}
                    </label>
                    <input
                      type="text"
                      placeholder={isBn ? 'যেমন: প্রধান কার্যালয় / মিরপুর জোন' : 'e.g. Head Office / Zone 1'}
                      value={assignedArea}
                      onChange={(e) => setAssignedArea(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'দৈনিক সংগ্রহের লক্ষ্যমাত্রা (৳)' : 'Daily Target (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={dailyTarget || ''}
                      onChange={(e) => setDailyTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim()}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'কর্মকর্তা যুক্ত করুন' : 'Confirm & Appoint'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit Role & Information Modal */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="text-base font-bold">
                    {isBn ? 'কর্মকর্তার পদবী ও তথ্য সম্পাদনা' : 'Edit Officer Role & Information'}
                  </h3>
                  <p className="text-xs text-indigo-200">{editingUser.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {editingUser.memberNo && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                  <LinkIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isBn 
                      ? `ইনি সমিতি সদস্য #${toBengaliNumber(editingUser.memberNo)} হিসেবে সংযুক্ত আছেন।`
                      : `This user is linked with Somiti Member #${editingUser.memberNo}.`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'কর্মকর্তার পদবী রোল (Role)' : 'Role & Permission Level'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setEditRole(r);
                    setEditRoleTitle(getDefaultRoleTitle(r));
                  }}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  <option value="admin">{isBn ? 'সুপার এডমিন (Super Admin)' : 'Super Admin'}</option>
                  <option value="president">{isBn ? 'সভাপতি (President)' : 'President'}</option>
                  <option value="secretary">{isBn ? 'সাধারণ সম্পাদক (General Secretary)' : 'General Secretary'}</option>
                  <option value="cashier">{isBn ? 'ক্যাশিয়ার (Cashier)' : 'Cashier'}</option>
                  <option value="manager">{isBn ? 'ম্যানেজার (Branch Manager)' : 'Manager'}</option>
                  <option value="field_officer">{isBn ? 'মাঠকর্মী / কালেক্টর (Field Officer)' : 'Field Officer / Collector'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'কাস্টম পদবী শিরোনাম (Role Title)' : 'Designation / Title'}
                </label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: সাধারণ সম্পাদক / শাখা ব্যবস্থাপক' : 'e.g. Branch Manager'}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নাম' : 'Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মোবাইল নম্বর' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'দায়িত্বপ্রাপ্ত এলাকা' : 'Assigned Area'}
                  </label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'দৈনিক লক্ষ্যমাত্রা (৳)' : 'Daily Target (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTarget || ''}
                    onChange={(e) => setEditTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="active"
                      checked={editStatus === 'active'}
                      onChange={() => setEditStatus('active')}
                      className="text-emerald-600"
                    />
                    <span className="text-emerald-700">{isBn ? 'সক্রিয় (Active)' : 'Active'}</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="inactive"
                      checked={editStatus === 'inactive'}
                      onChange={() => setEditStatus('inactive')}
                      className="text-rose-600"
                    />
                    <span className="text-rose-700">{isBn ? 'স্থগিত (Suspended)' : 'Suspended'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center ring-4 ring-rose-50">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'ইউজার মুছে ফেলতে চান?' : 'Delete this user?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isBn 
                  ? 'এই ইউজারকে ডিলিট করলে তিনি আর সফটওয়্যারে লগইন বা কোনো কার্যক্রম সম্পাদন করতে পারবেন না।'
                  : 'Deleting this user will permanently revoke their access to the software.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => confirmDelete(userToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                {isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
