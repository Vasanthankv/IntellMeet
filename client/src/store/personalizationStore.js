import { create } from 'zustand';
import { API_BASE_URL } from '../utils/apiConfig';

export const THEMES = [
  {
    id: 'dark',
    label: 'Default Dark',
    desc: 'Classic graphite charcoal interface',
    previewBg: 'bg-[#181818]',
    border: 'border-[#2E2E2E]',
    accent: '#3B82F6',
    canvasBg: '#121212',
    panelBg: '#1E1E1E',
    toolbarBg: '#181818',
    textColor: 'text-gray-100',
    badge: 'Standard'
  },
  {
    id: 'light',
    label: 'Clean Light',
    desc: 'Crisp bright modern aesthetic',
    previewBg: 'bg-[#F8FAFC]',
    border: 'border-[#E2E8F0]',
    accent: '#2563EB',
    canvasBg: '#F1F5F9',
    panelBg: '#FFFFFF',
    toolbarBg: '#FFFFFF',
    textColor: 'text-gray-900',
    badge: 'Light'
  },
  {
    id: 'midnight',
    label: 'Deep Midnight',
    desc: 'Dark navy blue celestial atmosphere',
    previewBg: 'bg-[#090D16]',
    border: 'border-[#1E293B]',
    accent: '#6366F1',
    canvasBg: '#060911',
    panelBg: '#0F172A',
    toolbarBg: '#0B0F19',
    textColor: 'text-indigo-50',
    badge: 'Celestial'
  },
  {
    id: 'obsidian',
    label: 'Obsidian Onyx',
    desc: 'Pure matte black with emerald accents',
    previewBg: 'bg-[#0A0A0A]',
    border: 'border-[#262626]',
    accent: '#10B981',
    canvasBg: '#050505',
    panelBg: '#121212',
    toolbarBg: '#0A0A0A',
    textColor: 'text-emerald-50',
    badge: 'Minimal'
  },
  {
    id: 'sunset',
    label: 'Sunset Amber',
    desc: 'Warm espresso and golden amber glow',
    previewBg: 'bg-[#171210]',
    border: 'border-[#35261D]',
    accent: '#F59E0B',
    canvasBg: '#110C0A',
    panelBg: '#1F1714',
    toolbarBg: '#18120F',
    textColor: 'text-amber-50',
    badge: 'Warm'
  },
  {
    id: 'ocean',
    label: 'Deep Ocean',
    desc: 'Teal maritime depths with cyan accents',
    previewBg: 'bg-[#081520]',
    border: 'border-[#142E42]',
    accent: '#06B6D4',
    canvasBg: '#050E16',
    panelBg: '#0B1E2D',
    toolbarBg: '#081520',
    textColor: 'text-cyan-50',
    badge: 'Ocean'
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    desc: 'Futuristic purple with neon fuchsia energy',
    previewBg: 'bg-[#120B20]',
    border: 'border-[#351C5C]',
    accent: '#D946EF',
    canvasBg: '#0A0514',
    panelBg: '#1A102E',
    toolbarBg: '#130B22',
    textColor: 'text-fuchsia-50',
    badge: 'Neon'
  }
];

export const WALLPAPER_PRESETS = [
  {
    id: 'default',
    label: 'Solid Minimal',
    desc: 'Distraction-free solid meeting canvas',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&q=80',
    cssBackground: 'bg-[#121212]',
    bgImage: ''
  },
  {
    id: 'mesh',
    label: 'Dark Tech Mesh',
    desc: 'Geometric tech pattern with subtle depth',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80',
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80'
  },
  {
    id: 'galaxy',
    label: 'Cosmic Nebula',
    desc: 'Deep space stars & astronomical aurora',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300&q=80',
    bgImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&q=80'
  },
  {
    id: 'aurora',
    label: 'Northern Lights',
    desc: 'Serene boreal night sky reflections',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&q=80',
    bgImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80'
  },
  {
    id: 'minimal',
    label: 'Luxury Twilight',
    desc: 'Smooth abstract gradient lighting',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80',
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80'
  },
  {
    id: 'waves',
    label: 'Fluid 3D Wave',
    desc: 'Elegantly sculpted architectural waves',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=80',
    bgImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&q=80'
  }
];

export const ALL_TOOLBAR_CONTROLS = [
  { id: 'audio', label: 'Audio (Mute/Unmute)', icon: 'Mic', category: 'Core Media' },
  { id: 'video', label: 'Video (Start/Stop)', icon: 'Video', category: 'Core Media' },
  { id: 'security', label: 'Security & Host Tools', icon: 'Shield', category: 'Controls' },
  { id: 'participants', label: 'Participants Panel', icon: 'Users', category: 'Controls' },
  { id: 'chat', label: 'Continuous Meeting Chat', icon: 'MessageSquare', category: 'Collaboration' },
  { id: 'share', label: 'Screen Sharing', icon: 'Share', category: 'Collaboration' },
  { id: 'reactions', label: 'Reactions & Raise Hand', icon: 'Smile', category: 'Interactivity' },
  { id: 'aiQuestions', label: 'AI Companion Questions', icon: 'HelpCircle', category: 'AI Tools' },
  { id: 'myNotes', label: 'My Notes (Personal & AI)', icon: 'FileText', category: 'Productivity' },
  { id: 'agenda', label: 'Agenda & Prep Materials', icon: 'ListChecks', category: 'Productivity' },
  { id: 'recording', label: 'Smart Recording', icon: 'Disc', category: 'Recording' },
  { id: 'streaming', label: 'Live Streaming Broadcast', icon: 'Radio', category: 'Broadcasting' },
  { id: 'whiteboard', label: 'Whiteboard Studio', icon: 'LayoutGrid', category: 'Collaboration' },
  { id: 'transcript', label: 'Live Captions & Transcript', icon: 'Subtitles', category: 'Accessibility' },
  { id: 'polls', label: 'Polls & Quizzes', icon: 'BarChart2', category: 'Interactivity' },
  { id: 'interpretation', label: 'Interpretation Channels', icon: 'Globe', category: 'Accessibility' }
];

export const usePersonalizationStore = create((set, get) => ({
  theme: 'dark',
  customWallpaper: {
    preset: 'default',
    url: '',
    blur: 0,
    opacity: 100
  },
  toolbarLayout: ALL_TOOLBAR_CONTROLS.map(c => c.id),
  hiddenToolbarItems: ['whiteboard', 'transcript', 'polls', 'interpretation'],
  defaultVideoLayout: 'gallery',
  multiSpeakerCount: 2,
  hideNonVideoParticipants: false,
  virtualBackground: {
    type: 'none',
    presetId: 'none',
    url: '',
    blurIntensity: 10
  },
  videoFilter: 'none',
  avatar: 'none',
  loading: false,

  fetchPreferences: async () => {
    try {
      set({ loading: true });
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/personalization/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        const p = data.preferences;
        set({
          theme: p.theme || 'dark',
          customWallpaper: p.customWallpaper || { preset: 'default', url: '', blur: 0, opacity: 100 },
          toolbarLayout: p.toolbarLayout?.length ? p.toolbarLayout : ALL_TOOLBAR_CONTROLS.map(c => c.id),
          hiddenToolbarItems: Array.isArray(p.hiddenToolbarItems) ? p.hiddenToolbarItems : ['whiteboard', 'transcript', 'polls', 'interpretation'],
          defaultVideoLayout: p.defaultVideoLayout || 'gallery',
          multiSpeakerCount: p.multiSpeakerCount || 2,
          hideNonVideoParticipants: Boolean(p.hideNonVideoParticipants),
          virtualBackground: p.virtualBackground || { type: 'none', presetId: 'none', url: '', blurIntensity: 10 },
          videoFilter: p.videoFilter || 'none',
          avatar: p.avatar || 'none',
          loading: false
        });
      }
    } catch (err) {
      console.error('Failed to load personalization preferences:', err);
    } finally {
      set({ loading: false });
    }
  },

  updatePreferences: async (partial) => {
    try {
      set((state) => ({ ...state, ...partial }));
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/personalization/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(partial)
      });
    } catch (err) {
      console.error('Failed to sync personalization preferences:', err);
    }
  },

  resetToolbar: async () => {
    try {
      const defaultLayout = ALL_TOOLBAR_CONTROLS.map(c => c.id);
      const defaultHidden = ['whiteboard', 'transcript', 'polls', 'interpretation'];
      set({ toolbarLayout: defaultLayout, hiddenToolbarItems: defaultHidden });

      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/personalization/reset-toolbar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to reset toolbar:', err);
    }
  },

  resetAll: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/personalization/reset-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        const p = data.preferences;
        set({
          theme: p.theme || 'dark',
          customWallpaper: p.customWallpaper,
          toolbarLayout: p.toolbarLayout,
          hiddenToolbarItems: p.hiddenToolbarItems,
          defaultVideoLayout: p.defaultVideoLayout,
          multiSpeakerCount: p.multiSpeakerCount,
          hideNonVideoParticipants: p.hideNonVideoParticipants,
          virtualBackground: p.virtualBackground,
          videoFilter: p.videoFilter,
          avatar: p.avatar
        });
      }
    } catch (err) {
      console.error('Failed to reset personalization:', err);
    }
  }
}));
