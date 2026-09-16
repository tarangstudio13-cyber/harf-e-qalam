import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Banner } from '../types.js';
import { getBanners, saveDocument, removeDocument } from '../lib/database.js';

interface AdminBannerManagerProps {
  onBannerUpdated?: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

// Curated high-resolution poetic banner templates
const PRESET_BANNERS = [
  {
    name: 'کلاسک قرطاس (Parchment)',
    url: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'شبِ سخن (Night Sky)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'مغلیہ نگارخانہ (Oriental Art)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'سیاہی و خامہ (Ink & Quill)',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  },
];

export const AdminBannerManager: React.FC<AdminBannerManagerProps> = ({
  onBannerUpdated,
  onShowToast,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all banners directly from Firestore.
  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      setBanners(await getBanners());
    } catch (err) {
      console.error('Error fetching banners:', err);
      onShowToast('Error loading banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Open modal for new banner
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl(PRESET_BANNERS[0].url);
    setLinkUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal to edit existing banner
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl || '');
    setIsActive(banner.isActive);
    setIsModalOpen(true);
  };

  // Handle local image file upload (converts to base64 DataURL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('Image size should be less than 8MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        onShowToast('Image loaded successfully');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      onShowToast('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Save banner (Create or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl.trim()) {
      onShowToast('Banner image is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        isActive,
      };

      // Keep one active home banner at a time.
      if (payload.isActive) {
        for (const banner of banners) {
          if (banner.id !== editingBanner?.id && banner.isActive) {
            await saveDocument('banners', banner.id, { ...banner, isActive: false });
          }
        }
      }

      if (editingBanner) {
        await saveDocument('banners', editingBanner.id, {
          ...editingBanner,
          ...payload,
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Banner updated successfully');
      } else {
        const id = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await saveDocument('banners', id, {
          id,
          ...payload,
          order: banners.length + 1,
          createdAt: new Date().toISOString(),
        });
        onShowToast('New banner added successfully');
      }

      await fetchBanners();
      if (onBannerUpdated) await onBannerUpdated();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      onShowToast(err.message || 'Error saving banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (banner: Banner) => {
    try {
      const nextActive = !banner.isActive;
      if (nextActive) {
        for (const other of banners) {
          if (other.id !== banner.id && other.isActive) {
            await saveDocument('banners', other.id, { ...other, isActive: false });
          }
        }
      }
      await saveDocument('banners', banner.id, {
        ...banner,
        isActive: nextActive,
        updatedAt: new Date().toISOString(),
      });
      onShowToast(banner.isActive ? 'Banner disabled' : 'Banner activated');
      await fetchBanners();
      if (onBannerUpdated) await onBannerUpdated();
    } catch (err) {
      console.error(err);
      onShowToast('Error toggling banner status');
    }
  };

  // Delete banner
  const handleDelete = async () => {
    if (!deletingBanner) return;
    try {
      await removeDocument('banners', deletingBanner.id);
      onShowToast('Banner deleted successfully');
      setDeletingBanner(null);
      await fetchBanners();
      if (onBannerUpdated) await onBannerUpdated();
    } catch (err) {
      console.error(err);
      onShowToast('Error deleting banner');
    }
  };

  const activeBanner = banners.find((b) => b.isActive);

  return (
    <div id="admin-banner-manager" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans-ui text-lg sm:text-xl font-bold text-stone-900">
              Home Screen Banners
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-sans-ui font-semibold">
              {banners.length} Total • {banners.filter((b) => b.isActive).length} Active
            </span>
          </div>
          <p className="text-xs text-stone-500 font-sans-ui mt-0.5">
            Administer the promotional and aesthetic banner section shown directly below the top header on the Home Screen.
          </p>
        </div>

        <button
          id="admin-add-banner-btn"
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs sm:text-sm font-sans-ui font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-sans-ui text-xs sm:text-sm font-bold text-stone-800">
              Live Home Screen Preview
            </span>
          </div>
          {activeBanner ? (
            <span className="text-[11px] font-sans-ui font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Banner Visible to Users
            </span>
          ) : (
            <span className="text-[11px] font-sans-ui font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              No Active Banner (Banner area completely hidden on Home Screen)
            </span>
          )}
        </div>

        {activeBanner ? (
          <div className="pt-1">
            <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-stone-200/90 relative bg-stone-900 aspect-[16/7] sm:aspect-[21/8] max-h-[220px] min-h-[140px] flex items-end">
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.title || 'Banner'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {(activeBanner.title || activeBanner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />
              )}
              {(activeBanner.title || activeBanner.subtitle) && (
                <div className="relative z-10 p-4 sm:p-5 text-right w-full">
                  {activeBanner.title && (
                    <h3 className="font-nastaliq text-lg sm:text-2xl text-amber-100 font-bold leading-snug">
                      {activeBanner.title}
                    </h3>
                  )}
                  {activeBanner.subtitle && (
                    <p className="font-nastaliq text-xs sm:text-sm text-stone-200 mt-0.5 leading-relaxed">
                      {activeBanner.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 px-1 font-sans-ui">
              <span>Aspect ratio adjusts smoothly for Android & mobile screens.</span>
              <button
                type="button"
                onClick={() => handleOpenEdit(activeBanner)}
                className="text-amber-800 hover:text-amber-950 font-semibold cursor-pointer underline"
              >
                Edit Current Banner
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 text-center bg-stone-50/70 border border-dashed border-stone-200 rounded-xl space-y-2">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="font-sans-ui text-sm font-medium text-stone-700">
              No active banner selected
            </p>
            <p className="font-sans-ui text-xs text-stone-500 max-w-md mx-auto">
              Because there is no active banner, the banner area on the Home Screen will not take up any space.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans-ui font-semibold text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Active Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Banners Catalog Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-sans-ui text-sm font-bold text-stone-900">
            All Configured Banners
          </h3>
          <button
            type="button"
            onClick={fetchBanners}
            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer font-sans-ui"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs font-sans-ui">
            No banners created yet. Click "Add New Banner" above.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
              >
                {/* Thumbnail and Info */}
                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 sm:w-28 sm:h-16 rounded-xl overflow-hidden bg-stone-900 relative shrink-0 border border-stone-200/80">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-tight">
                        {banner.title || 'Unlabeled Banner'}
                      </span>
                      {banner.isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans-ui font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 font-sans-ui font-medium">
                          Disabled
                        </span>
                      )}
                    </div>

                    {banner.subtitle && (
                      <p className="font-nastaliq text-xs text-stone-600 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}

                    {banner.linkUrl && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-800 font-sans-ui">
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{banner.linkUrl}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans-ui font-medium transition-colors cursor-pointer border ${
                      banner.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                    title={banner.isActive ? 'Deactivate banner' : 'Activate banner'}
                  >
                    {banner.isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                    title="Edit banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingBanner(banner)}
                    className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                    title="Delete banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT BANNER MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-sans-ui text-base sm:text-lg font-bold text-stone-900">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Image Preview Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans-ui font-semibold text-stone-700 block">
                  Banner Image Preview
                </label>
                <div className="w-full rounded-2xl overflow-hidden shadow-2xs border border-stone-200 bg-stone-900 aspect-[16/7] relative flex items-end">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-xs">
                      No image selected
                    </div>
                  )}

                  {(title || subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />
                  )}

                  {(title || subtitle) && (
                    <div className="relative z-10 p-3 sm:p-4 text-right w-full">
                      {title && (
                        <h4 className="font-nastaliq text-base sm:text-xl text-amber-100 font-bold leading-snug">
                          {title}
                        </h4>
                      )}
                      {subtitle && (
                        <p className="font-nastaliq text-xs text-stone-200 mt-0.5 leading-relaxed">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload or Image URL */}
              <div className="space-y-2">
                <label className="text-xs font-sans-ui font-semibold text-stone-700 block">
                  Select or Upload Image
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-sans-ui font-semibold rounded-xl border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>{isUploading ? 'Uploading Image...' : 'Upload Image File (Device / Gallery)'}</span>
                  </button>
                </div>

                {/* Direct Image URL input */}
                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full px-3.5 py-2 text-xs font-sans-ui border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Presets Grid */}
                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 font-sans-ui">
                    Or select from curated poetic backgrounds:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {PRESET_BANNERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-center text-[10px] font-sans-ui transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          imageUrl === preset.url
                            ? 'border-amber-600 bg-amber-50/80 font-bold text-amber-950 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-8 object-cover rounded-lg"
                        />
                        <span className="truncate w-full">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Subtitle Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-sans-ui font-semibold text-stone-700 block">
                    Banner Title (عنوان — اختیاری)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: دیوانِ سخن"
                    className="w-full px-3.5 py-2 text-sm font-nastaliq border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="text-[10px] text-stone-400 font-sans-ui">
                    Leave blank to show image only without title
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans-ui font-semibold text-stone-700 block">
                    Subtitle (ذیلی متن — اختیاری)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="مثال: منتخب اردو شعراء کا کلام"
                    className="w-full px-3.5 py-2 text-sm font-nastaliq border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="text-[10px] text-stone-400 font-sans-ui">
                    Optional subtitle description
                  </span>
                </div>
              </div>

              {/* Link URL (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-sans-ui font-semibold text-stone-700 block">
                  Link / Click Destination (لنک — اختیاری)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Optional URL if banner is clickable (e.g. https://...)"
                  className="w-full px-3.5 py-2 text-xs font-sans-ui border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <input
                  id="banner-is-active-chk"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                />
                <label htmlFor="banner-is-active-chk" className="text-xs font-sans-ui text-stone-800 cursor-pointer">
                  <span className="font-semibold">Set as Active Banner</span>
                  <span className="block text-[11px] text-stone-500">
                    When active, this banner will automatically appear below the header on the Home Screen.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-banner-btn"
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-sans-ui font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Update Banner' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE BANNER CONFIRMATION MODAL ================= */}
      {deletingBanner && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans-ui text-base font-bold text-stone-900">
              Delete this banner?
            </h3>
            <p className="text-xs text-stone-500 font-sans-ui">
              This banner will be removed. If it was the active banner, the Home Screen banner area will be cleanly hidden.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBanner(null)}
                className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-sans-ui font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
