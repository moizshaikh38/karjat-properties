import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Edit2,
  Trash2,
  Building2 as Building,
  Eye,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  TrendingUp,
  Tag,
  Check,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

const PRESET_PHOTOS = [
  { label: 'Luxury Villa', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
  { label: 'Mountain View', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800' },
  { label: 'Green Farmhouse', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
  { label: 'Sanctioned Plot', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800' },
  { label: 'Living Room', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
  { label: 'Private Pool', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800' },
];

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<any | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Shared for Add & Edit)
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    name: '',
    description: '',
    property_type: 'villa',
    listing_type: 'sale',
    status: 'available',
    location: '',
    location_city: 'Karjat',
    city: 'Karjat',
    location_neighborhood: '',
    price: '',
    bhk: '3',
    bathrooms: '3',
    size_sqft: '',
    carpet_area_sqft: '',
    builtup_area_sqft: '',
    amenities: 'Private Pool, Landscaped Garden, 24x7 Security, Power Backup',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties');
      const raw = res.data?.data;
      const list = raw?.properties || (Array.isArray(raw) ? raw : []);
      setProperties(list);
    } catch (err) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Quick Status Updater
  const handleQuickStatusChange = async (id: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/properties/${id}/status`, { status: newStatus.toLowerCase() });
      toast.success(`Property marked as ${newStatus.toUpperCase()}! 🎉`);
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus.toLowerCase() } : p))
      );
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty((prev: any) => ({ ...prev, status: newStatus.toLowerCase() }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update property status');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (prop: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPropertyToEdit(prop);
    const existingImages =
      prop.images && prop.images.length > 0
        ? prop.images
        : prop.media && prop.media.length > 0
        ? prop.media.map((m: any) => m.url || m)
        : [];

    setFormData({
      id: prop.id,
      title: prop.title || prop.name || '',
      name: prop.name || prop.title || '',
      description: prop.description || '',
      property_type: prop.property_type || 'villa',
      listing_type: prop.listing_type || 'sale',
      status: (prop.status || 'available').toLowerCase(),
      location: prop.location || prop.location_neighborhood || 'Karjat',
      location_city: prop.location_city || prop.city || 'Karjat',
      city: prop.city || prop.location_city || 'Karjat',
      location_neighborhood: prop.location_neighborhood || '',
      price: String(prop.price || ''),
      bhk: String(prop.bhk ?? '3'),
      bathrooms: String(prop.bathrooms ?? '3'),
      size_sqft: String(prop.size_sqft || prop.carpet_area_sqft || ''),
      carpet_area_sqft: String(prop.carpet_area_sqft || prop.size_sqft || ''),
      builtup_area_sqft: String(prop.builtup_area_sqft || prop.size_sqft || ''),
      amenities: Array.isArray(prop.amenities)
        ? prop.amenities.map((a: any) => (typeof a === 'string' ? a : a.name || a.amenity)).join(', ')
        : 'Private Pool, Landscaped Garden, 24x7 Security',
      images: existingImages.length > 0 ? existingImages : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    });
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      id: '',
      title: '',
      name: '',
      description: '',
      property_type: 'villa',
      listing_type: 'sale',
      status: 'available',
      location: '',
      location_city: 'Karjat',
      city: 'Karjat',
      location_neighborhood: '',
      price: '',
      bhk: '3',
      bathrooms: '3',
      size_sqft: '',
      carpet_area_sqft: '',
      builtup_area_sqft: '',
      amenities: 'Private Pool, Landscaped Garden, 24x7 Security, Power Backup',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    });
    setIsAddModalOpen(true);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error('Please enter property title and price');
      return;
    }

    try {
      setIsSubmitting(true);
      const amenityArray = formData.amenities.split(',').map((a) => a.trim()).filter(Boolean);
      const payload: any = {
        title: formData.title,
        name: formData.name || formData.title,
        description: formData.description,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        status: formData.status.toLowerCase(),
        location: formData.location || formData.location_neighborhood || formData.city || 'Karjat',
        city: formData.city || 'Karjat',
        location_city: formData.city || 'Karjat',
        location_neighborhood: formData.location_neighborhood,
        price: Number(formData.price),
        bhk: Number(formData.bhk) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        size_sqft: Number(formData.size_sqft || formData.carpet_area_sqft || 0),
        carpet_area_sqft: Number(formData.carpet_area_sqft || formData.size_sqft || 0),
        builtup_area_sqft: Number(formData.builtup_area_sqft || formData.size_sqft || 0),
        amenities: amenityArray,
        images: formData.images,
      };

      if (isEdit) {
        await api.patch(`/properties/${formData.id}`, payload);
        toast.success('Property updated successfully! ✨');
        setIsEditModalOpen(false);
      } else {
        await api.post('/properties', payload);
        toast.success('Property added successfully! 🏡');
        setIsAddModalOpen(false);
      }
      fetchProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Property Confirmation
  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/properties/${propertyToDelete.id}`);
      toast.success('Property deleted successfully! 🗑️');
      setPropertyToDelete(null);
      if (selectedProperty && selectedProperty.id === propertyToDelete.id) {
        setSelectedProperty(null);
      }
      fetchProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete property');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Photo handlers
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleAddPresetPhoto = (url: string) => {
    if (formData.images.includes(url)) {
      toast('Photo already in gallery', { icon: 'ℹ️' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
    toast.success('Photo added to gallery');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string],
          }));
          toast.success(`Attached ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Calculations for Portfolio Stats Bar
  const totalUnits = properties.length;
  const availableUnits = properties.filter((p) => (p.status || '').toLowerCase() === 'available').length;
  const reservedUnits = properties.filter((p) => (p.status || '').toLowerCase() === 'reserved').length;
  const soldUnits = properties.filter((p) => (p.status || '').toLowerCase() === 'sold').length;
  const totalPortfolioValue = properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const formatPrice = (price: number) => {
    if (!price) return '₹ 0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const formatShortPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lakh`;
    return `₹${price}`;
  };

  const filteredProperties = properties
    .filter((p) => statusFilter === 'All' || (p.status || '').toLowerCase() === statusFilter.toLowerCase())
    .filter((p) => typeFilter === 'All' || (p.property_type || '').toLowerCase() === typeFilter.toLowerCase())
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.location_city && p.location_city.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.property_code && p.property_code.toLowerCase().includes(q))
      );
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Building className="w-7 h-7 text-[var(--color-primary)]" />
            Karjat Real Estate Catalog
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage your verified inventory, photos, pricing, and availability.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'grid'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'table'
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* PORTFOLIO STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Total Inventory
          </div>
          <div className="text-2xl font-bold text-[var(--color-text)] mt-1">{totalUnits} Units</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Worth {formatShortPrice(totalPortfolioValue)}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Available</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{availableUnits} Units</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Ready for inquiry</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Reserved</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{reservedUnits} Units</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Token received</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Sold Out</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{soldUnits} Units</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Closed deals</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] overflow-x-auto hide-scrollbar">
            {['All', 'Available', 'Reserved', 'Sold', 'Inactive'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-[var(--color-surface-elevated)] shadow-sm text-[var(--color-text)] font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Property Type Filter */}
          <div className="flex gap-1.5 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] overflow-x-auto hide-scrollbar">
            {['All', 'Villa', 'Apartment', 'Farmhouse', 'Plot'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  typeFilter === t
                    ? 'bg-[var(--color-primary)] text-white font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, location, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)] shadow-xs"
          />
        </div>
      </div>

      {/* PROPERTY LISTINGS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center shadow-xs">
          <Building className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-[var(--color-text)]">No properties found</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Try adjusting your search criteria or add a new property listing.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      ) : view === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => {
            const img = (prop.images && prop.images[0]) || (prop.media && prop.media[0]?.url);
            const statusKey = (prop.status || 'available').toLowerCase();

            return (
              <div
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {img ? (
                      <img
                        src={img}
                        alt={prop.title || prop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building className="w-12 h-12 text-white/30" />
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full shadow-md capitalize ${
                          statusKey === 'available'
                            ? 'bg-emerald-600 text-white'
                            : statusKey === 'reserved'
                            ? 'bg-amber-600 text-white'
                            : statusKey === 'sold'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {prop.status || 'available'}
                      </span>
                    </div>

                    {/* Property Code */}
                    {prop.property_code && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] px-2.5 py-0.5 rounded-md font-mono font-medium">
                        {prop.property_code}
                      </div>
                    )}

                    {/* Property Type */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-xs px-2.5 py-0.5 rounded-md font-semibold capitalize shadow-xs">
                      {prop.property_type || 'Property'}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="text-2xl font-black text-[var(--color-text)] mb-1">
                      {formatPrice(prop.price)}
                    </div>
                    <h3 className="font-semibold text-base text-[var(--color-text)] line-clamp-1">
                      {prop.title || prop.name}
                    </h3>
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-primary)]" />
                      <span className="truncate">
                        {prop.location_neighborhood ? `${prop.location_neighborhood}, ` : ''}
                        {prop.location_city || prop.location || prop.city || 'Karjat'}
                      </span>
                    </div>

                    {/* Specs Chips */}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                      {prop.bhk !== undefined && prop.bhk > 0 && (
                        <div className="flex items-center gap-1 font-medium text-[var(--color-text)]">
                          <Bed className="w-3.5 h-3.5 text-[var(--color-primary)]" /> {prop.bhk} BHK
                        </div>
                      )}
                      {prop.bathrooms !== undefined && prop.bathrooms > 0 && (
                        <div className="flex items-center gap-1 font-medium text-[var(--color-text)]">
                          <Bath className="w-3.5 h-3.5 text-[var(--color-primary)]" /> {prop.bathrooms} Bath
                        </div>
                      )}
                      {(prop.size_sqft || prop.carpet_area_sqft) && (
                        <div className="flex items-center gap-1 font-medium text-[var(--color-text)]">
                          <Maximize className="w-3.5 h-3.5 text-[var(--color-primary)]" />{' '}
                          {prop.size_sqft || prop.carpet_area_sqft} sqft
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="px-4 py-3 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  {/* Quick Status Select */}
                  <select
                    value={statusKey}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleQuickStatusChange(prop.id, e.target.value)}
                    className="text-xs font-semibold px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] outline-none cursor-pointer"
                  >
                    <option value="available">🟢 Available</option>
                    <option value="reserved">🟡 Reserved</option>
                    <option value="sold">🔴 Sold</option>
                    <option value="inactive">⚪ Inactive</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(prop, e)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors"
                      title="Edit Property"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPropertyToDelete(prop);
                      }}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Property</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Specs</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
              {filteredProperties.map((prop) => {
                const statusKey = (prop.status || 'available').toLowerCase();
                return (
                  <tr
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    className="hover:bg-[var(--color-surface-elevated)] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text)]">{prop.title || prop.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono">{prop.property_code}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-[var(--color-text-muted)]">{prop.property_type}</td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">
                      {prop.location_neighborhood ? `${prop.location_neighborhood}, ` : ''}
                      {prop.location_city || prop.city || 'Karjat'}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[var(--color-text)]">{formatPrice(prop.price)}</td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">
                      {prop.bhk ? `${prop.bhk} BHK • ` : ''}
                      {prop.size_sqft || prop.carpet_area_sqft || '—'} sqft
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={statusKey}
                        onChange={(e) => handleQuickStatusChange(prop.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer capitalize ${
                          statusKey === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : statusKey === 'reserved'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : statusKey === 'sold'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProperty(prop)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--color-surface)]"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(prop)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--color-surface)]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPropertyToDelete(prop)}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-600 rounded-md hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT PROPERTY MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Property Details' : 'Add New Karjat Property'}
        maxWidth="2xl"
      >
        <form onSubmit={(e) => handleSubmitForm(e, isEditModalOpen)} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Property Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Riverfront Luxury Villa"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              >
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="flat">Flat</option>
                <option value="farmhouse">Farmhouse</option>
                <option value="plot">Plot / Land</option>
                <option value="bungalow">Bungalow</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Price (₹ INR) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 12500000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Location / Area</label>
              <input
                type="text"
                placeholder="e.g. Bhilavle, Karjat"
                value={formData.location_neighborhood}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location_neighborhood: e.target.value,
                    location: e.target.value || 'Karjat',
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">BHK Config</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={formData.bhk}
                onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Bathrooms</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Carpet Area (sq.ft)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1800"
                value={formData.carpet_area_sqft}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carpet_area_sqft: e.target.value,
                    size_sqft: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)] font-medium"
              >
                <option value="available">🟢 Available</option>
                <option value="reserved">🟡 Reserved</option>
                <option value="sold">🔴 Sold</option>
                <option value="inactive">⚪ Inactive</option>
              </select>
            </div>
          </div>

          {/* PHOTO MANAGEMENT & DIRECT UPLOAD SECTION */}
          <div className="p-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" />
                Property Photos & Elevation ({formData.images.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-colors flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Upload from Computer
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste Image URL (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text)] outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90"
              >
                Add URL
              </button>
            </div>

            {/* Quick-Pick Karjat Presets */}
            <div>
              <div className="text-[11px] text-[var(--color-text-muted)] font-medium mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add Karjat HD Photos:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetPhoto(preset.url)}
                    className="px-2 py-0.5 bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded text-[10px] text-[var(--color-text)] transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos Gallery Preview */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden h-20 bg-slate-900 border border-[var(--color-border)]">
                    <img src={imgUrl} alt={`Property ${index}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                      title="Remove Photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Amenities (comma separated)</label>
            <input
              type="text"
              placeholder="Private Pool, Garden, 24x7 Security, Power Backup"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description of the property features, views, and surroundings..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Saving...' : isEditModalOpen ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <Modal
          isOpen={Boolean(selectedProperty)}
          onClose={() => setSelectedProperty(null)}
          title={selectedProperty.title || selectedProperty.name}
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Main Photo Gallery */}
            <div className="h-64 bg-slate-900 rounded-2xl overflow-hidden relative">
              {selectedProperty.images && selectedProperty.images[0] ? (
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <Building className="w-16 h-16" />
                </div>
              )}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedProperty.status || 'available'}
              </div>
            </div>

            {/* Additional Photos Strip */}
            {selectedProperty.images && selectedProperty.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedProperty.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    className="h-16 w-24 object-cover rounded-lg border border-[var(--color-border)] flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-[var(--color-text)]">
                  {formatPrice(selectedProperty.price)}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                  {selectedProperty.location_neighborhood ? `${selectedProperty.location_neighborhood}, ` : ''}
                  {selectedProperty.location_city || selectedProperty.city || 'Karjat'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--color-text-muted)] font-mono font-medium">
                  {selectedProperty.property_code}
                </div>
                <div className="text-sm font-bold text-[var(--color-primary)] capitalize mt-1">
                  {selectedProperty.property_type}
                </div>
              </div>
            </div>

            {/* Quick Status Bar inside details modal */}
            <div className="p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
              <div className="text-xs font-semibold text-[var(--color-text)]">Quick Status Change:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickStatusChange(selectedProperty.id, 'available')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                    (selectedProperty.status || '').toLowerCase() === 'available'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  🟢 Available
                </button>
                <button
                  onClick={() => handleQuickStatusChange(selectedProperty.id, 'reserved')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                    (selectedProperty.status || '').toLowerCase() === 'reserved'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  🟡 Reserved
                </button>
                <button
                  onClick={() => handleQuickStatusChange(selectedProperty.id, 'sold')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                    (selectedProperty.status || '').toLowerCase() === 'sold'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  🔴 Sold
                </button>
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[var(--color-surface-elevated)] rounded-xl text-center border border-[var(--color-border)]">
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">Configuration</div>
                <div className="text-base font-bold text-[var(--color-text)] mt-0.5">
                  {selectedProperty.bhk ? `${selectedProperty.bhk} BHK` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">Bathrooms</div>
                <div className="text-base font-bold text-[var(--color-text)] mt-0.5">
                  {selectedProperty.bathrooms ? `${selectedProperty.bathrooms} Bath` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">Carpet Area</div>
                <div className="text-base font-bold text-[var(--color-text)] mt-0.5">
                  {selectedProperty.size_sqft || selectedProperty.carpet_area_sqft
                    ? `${selectedProperty.size_sqft || selectedProperty.carpet_area_sqft} sqft`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProperty.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                  Description
                </h4>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">{selectedProperty.description}</p>
              </div>
            )}

            {/* Amenities */}
            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Amenities & Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.amenities.map((amenity: any, idx: number) => {
                    const label = typeof amenity === 'string' ? amenity : amenity.name || amenity.amenity;
                    return (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] rounded-md"
                      >
                        ✓ {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => {
                  const toDel = selectedProperty;
                  setSelectedProperty(null);
                  setPropertyToDelete(toDel);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Property
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedProperty;
                    setSelectedProperty(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold rounded-lg hover:bg-[var(--color-surface-elevated)] flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Property
                </button>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {propertyToDelete && (
        <Modal
          isOpen={Boolean(propertyToDelete)}
          onClose={() => setPropertyToDelete(null)}
          title="Delete Property"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--color-text)]">
                  Delete "{propertyToDelete.title || propertyToDelete.name}"?
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  This action cannot be undone. The property will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-lg hover:bg-[var(--color-surface-elevated)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmDeleteProperty}
                className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
