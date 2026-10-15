import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  Camera, Check, Shield, User, Mail, Briefcase, MapPin, Phone, 
  Globe, Clock, Key, Upload, Trash2, X, Image as ImageIcon, Sparkles 
} from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || '');
  const fileInputRef = useRef(null);

  const getToken = () => localStorage.getItem('intellmeet_token') || localStorage.getItem('token');

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
  ];

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    displayName: user?.name || '',
    pronouns: user?.pronouns || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    company: user?.company || '',
    phone: user?.phone || '',
    location: user?.location || '',
    language: 'English',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dateFormat: 'mm/dd/yyyy',
    timeFormat: 'Use 12-hour time (Example: 02:00 PM)',
    pmi: user?.pmi || '',
    hostKey: '852031',
    email: user?.email || '',
    role: user?.role || 'Member',
    license: user?.license || 'Free Plan',
    avatar: user?.avatar || '',
  });

  // Load latest profile from MongoDB on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          setProfileData(prev => ({
            ...prev,
            name: u.name || prev.name,
            firstName: u.name?.split(' ')[0] || prev.firstName,
            lastName: u.name?.split(' ').slice(1).join(' ') || prev.lastName,
            displayName: u.name || prev.displayName,
            pronouns: u.pronouns || prev.pronouns,
            jobTitle: u.jobTitle || prev.jobTitle,
            department: u.department || prev.department,
            company: u.company || prev.company,
            phone: u.phone || prev.phone,
            location: u.location || prev.location,
            pmi: u.pmi || prev.pmi,
            email: u.email || prev.email,
            role: u.role || prev.role,
            license: u.license || prev.license,
            avatar: u.avatar || prev.avatar,
          }));
          setPhotoPreview(u.avatar || '');
        }
      } catch (err) {
        console.error('Failed to load profile from backend:', err);
      }
    };
    fetchProfile();
  }, []);

  const saveToBackend = async (updatedFields) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        toast.error('Authentication token missing. Please sign in again.');
        return;
      }
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile saved to database!');
        if (updateUser) {
          updateUser(data.user || updatedFields);
        }
        if (setUser && data.user) {
          setUser(data.user);
        }
      } else {
        toast.error(data.message || 'Failed to save changes');
      }
    } catch (err) {
      toast.error('Network error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    const updated = { ...profileData, [field]: value };
    // If updating name or first/last name, sync name
    if (field === 'firstName' || field === 'lastName') {
      const first = field === 'firstName' ? value : profileData.firstName;
      const last = field === 'lastName' ? value : profileData.lastName;
      updated.name = `${first} ${last}`.trim();
      updated.displayName = updated.name;
    }
    setProfileData(updated);
    saveToBackend(updated);
  };

  // Open photo change modal
  const handleOpenPhotoModal = () => {
    setPhotoPreview(profileData.avatar || '');
    setShowPhotoModal(true);
  };

  // Handle image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Confirm photo update
  const handleSavePhoto = async () => {
    const updated = { ...profileData, avatar: photoPreview };
    setProfileData(updated);
    await saveToBackend({ avatar: photoPreview });
    setShowPhotoModal(false);
  };

  const sectionHeaderStyle = "bg-gray-100 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 rounded-md mb-2 mt-8 flex items-center justify-between";
  const rowStyle = "flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-100 hover:bg-gray-50/70 transition-colors min-h-[64px]";
  const labelStyle = "w-full sm:w-1/3 text-sm text-gray-600 font-medium px-6";
  const valueStyle = "w-full sm:w-1/2 text-sm text-gray-900 px-6 sm:px-0 mt-1 sm:mt-0";
  const actionStyle = "w-full sm:w-1/6 text-right px-6 flex justify-end gap-2 mt-2 sm:mt-0";
  const linkStyle = "text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors cursor-pointer";

  const EditableRow = ({ label, field, type = 'text', mask = false, note = '', actionLabel = 'Edit', extraInfo = null, options = null }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(profileData[field] || '');
    const [showMask, setShowMask] = useState(mask);

    const handleSave = () => {
      updateField(field, tempValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempValue(profileData[field] || '');
      setIsEditing(false);
    };

    let displayValue = profileData[field] || 'Not set';
    if (mask && showMask && profileData[field]) {
      displayValue = field === 'pmi' ? `*** *** *${profileData[field].slice(-3)}` : '••••••••';
    }

    return (
      <div className={rowStyle}>
        <div className={labelStyle}>
          {label} {note && <span className="text-gray-400 text-xs ml-1 cursor-help" title={note}>ⓘ</span>}
        </div>
        <div className={valueStyle}>
          {isEditing ? (
            options ? (
              <select 
                value={tempValue} 
                onChange={e => setTempValue(e.target.value)}
                className="border border-blue-500 rounded-lg px-3 py-1.5 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm bg-white"
                autoFocus
              >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input 
                type={type} 
                value={tempValue} 
                onChange={e => setTempValue(e.target.value)}
                className="border border-blue-500 rounded-lg px-3 py-1.5 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
                autoFocus
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            )
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className={displayValue === 'Not set' ? 'text-gray-400 italic' : 'text-gray-900 font-medium'}>
                  {displayValue}
                </span>
                {mask && (
                  <button onClick={() => setShowMask(!showMask)} className="text-gray-400 hover:text-gray-600 outline-none">
                    <Key className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {extraInfo && !isEditing && <div className="mt-1 text-gray-500 text-xs">{extraInfo}</div>}
            </div>
          )}
        </div>
        <div className={actionStyle}>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors">
                Save
              </button>
              <button onClick={handleCancel} className="bg-gray-100 text-gray-700 px-3 py-1 border border-gray-300 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => { setTempValue(profileData[field] || ''); setIsEditing(true); }} className={linkStyle}>
              {profileData[field] ? actionLabel : 'Add'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 bg-white min-h-screen">
      
      {/* Top Breadcrumb & Status */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>IntellMeet</span>
            <span>/</span>
            <span className="text-blue-600">User Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Personal Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-3 h-3" /> {profileData.role}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" /> {profileData.license}
          </span>
        </div>
      </div>

      {/* Top Banner Alert */}
      <div className="mb-8 p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3">
        <div className="text-blue-600 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          When you host or join meetings on IntellMeet, your profile information (display name, profile image, pronouns) is visible to participants. To configure meeting security, audio, video, or breakout room preferences, visit <Link to="/settings" className="text-blue-600 font-semibold hover:underline">User Settings</Link>.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt={profileData.name} className="w-24 h-24 rounded-2xl object-cover shadow-md ring-4 ring-white" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-purple-700 to-indigo-800 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-white">
                {profileData.name ? profileData.name.slice(0, 2).toUpperCase() : 'KV'}
              </div>
            )}
            <button 
              onClick={handleOpenPhotoModal}
              title="Change Profile Picture"
              className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:scale-110 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
              {profileData.pronouns && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-gray-200 text-gray-700 font-medium">
                  {profileData.pronouns}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-0.5 font-medium">{profileData.jobTitle || 'Team Member'} • {profileData.department}</p>
            <p className="text-gray-400 text-xs mt-1">{profileData.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleOpenPhotoModal}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
          >
            Change Photo
          </button>
          <Link 
            to="/settings" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Meeting Settings
          </Link>
        </div>
      </div>

      {/* 1. Personal Information Section */}
      <div className={sectionHeaderStyle}>
        <span>Personal Information</span>
        <span className="text-[11px] font-normal lowercase text-gray-500">Navigation: Profile → Personal Information</span>
      </div>

      <EditableRow label="First Name" field="firstName" />
      <EditableRow label="Last Name" field="lastName" />
      <EditableRow label="Display Name" field="displayName" note="Shown to participants inside meeting rooms" />
      <EditableRow 
        label="Pronouns" 
        field="pronouns" 
        options={['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'Prefer not to say']} 
        note="Visible alongside your name during meetings"
      />
      <EditableRow label="Job Title" field="jobTitle" />
      <EditableRow label="Department" field="department" />
      <EditableRow label="Company / Organization" field="company" />
      <EditableRow label="Phone" field="phone" type="tel" note="Used for meeting SMS invites & security verification" />
      <EditableRow label="Location" field="location" />
      <EditableRow 
        label="Language" 
        field="language" 
        options={['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi']} 
      />
      <EditableRow 
        label="Time Zone" 
        field="timezone" 
        options={[
          '(GMT-08:00) Pacific Time (US & Canada)', 
          '(GMT-05:00) Eastern Time (US & Canada)', 
          '(GMT+00:00) London, UTC', 
          '(GMT+05:30) India Standard Time', 
          '(GMT+09:00) Tokyo'
        ]} 
      />

      {/* 2. Meeting Credentials Section */}
      <div className={sectionHeaderStyle}>
        <span>Meeting Credentials</span>
        <span className="text-[11px] font-normal lowercase text-gray-500">Navigation: Profile → Meeting</span>
      </div>

      <EditableRow 
        label="Personal Meeting ID (PMI)" 
        field="pmi" 
        mask={true} 
        extraInfo={
          <div className="mt-2 text-xs">
            <span className="text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">https://intellmeet.io/j/{profileData.pmi.replace(/\s/g, '')}</span>
            <p className="text-gray-500 mt-1">Your permanent meeting URL for instant and scheduled meetings.</p>
          </div>
        }
      />
      <EditableRow label="Host Key" field="hostKey" mask={true} type="password" note="6-digit PIN used to claim host role on room devices" />

      {/* 3. Sign-in & Account Info Section */}
      <div className={sectionHeaderStyle}>
        <span>Sign-In & Account Information</span>
        <span className="text-[11px] font-normal lowercase text-gray-500">Navigation: Profile → Account</span>
      </div>

      <div className={rowStyle}>
        <div className={labelStyle}>Sign-In Email</div>
        <div className={valueStyle}>
          <span className="font-medium text-gray-900">{profileData.email}</span>
          <p className="text-xs text-gray-500 mt-0.5">Primary verified account address</p>
        </div>
        <div className={actionStyle}>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Verified</span>
        </div>
      </div>

      <div className={rowStyle}>
        <div className={labelStyle}>Account Role</div>
        <div className={valueStyle}>
          <span className="font-semibold text-gray-900">{profileData.role}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {profileData.role === 'Account Owner' ? 'Highest account permissions. Full access to Admin Center & Billing.' : 
             profileData.role === 'Administrator' ? 'Manages users, licenses, groups, and meeting settings.' : 'Standard user with meeting hosting privileges.'}
          </p>
        </div>
        <div className={actionStyle}>
          <Link to="/admin" className={linkStyle}>Admin Center</Link>
        </div>
      </div>

      <div className={rowStyle}>
        <div className={labelStyle}>License Type</div>
        <div className={valueStyle}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{profileData.license}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Active</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Unlimited meeting durations, cloud recording, and Gemini AI Summaries enabled.</p>
        </div>
        <div className={actionStyle}>
          <Link to="/info/pricing" className={linkStyle}>Manage License</Link>
        </div>
      </div>

      {/* Hidden File Input for Custom Photo Upload */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Zoom-Parity Change Profile Picture Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Change Profile Picture</h3>
                <p className="text-xs text-gray-500 mt-0.5">Upload a photo from your computer or pick an avatar</p>
              </div>
              <button 
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Preview Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative group mb-2">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Avatar Preview" 
                      className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-blue-500/20 border-2 border-white"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-purple-700 to-indigo-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-blue-500/20 border-2 border-white">
                      {profileData.name ? profileData.name.slice(0, 2).toUpperCase() : 'KV'}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Live Preview</span>
              </div>

              {/* Upload & Remove buttons */}
              <div className="flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => setPhotoPreview('')}
                    className="flex items-center gap-2 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>

              {/* Preset Avatars */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Or Choose from Avatars
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoPreview(url)}
                      className={`relative rounded-xl overflow-hidden p-0.5 transition-all cursor-pointer ${
                        photoPreview === url 
                          ? 'ring-2 ring-blue-600 scale-105 shadow-md' 
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-12 object-cover rounded-lg" />
                      {photoPreview === url && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center rounded-lg">
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white shadow">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
