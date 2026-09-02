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
  Building2,
  Eye,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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

  // Form State
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

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties');
      const raw = res.data?.data;
      const list = raw?.properties || (Array.isArray(raw) ? raw : []);
      setProperties(list);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleQuickStatusChange = async (id: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/properties/${id}/status`, { status: newStatus.toLowerCase() });
      toast.success(`Marked as ${newStatus}`);
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus.toLowerCase() } : p))
      );
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleOpenEdit = (prop: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPropertyToEdit(prop);
    const existingImages = prop.images?.length ? prop.images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'];
    setFormData({
      id: prop.id,
      title: prop.title || prop.name || '',
      name: prop.name || prop.title || '',
      description: prop.description || '',
      property_type: prop.property_type || 'villa',
      listing_type: prop.listing_type || 'sale',
      status: (prop.status || 'available').toLowerCase(),
      location: prop.location || prop.location_neighborhood || 'Karjat',
      location_city: prop.city || 'Karjat',
      city: prop.city || 'Karjat',
      location_neighborhood: prop.location_neighborhood || '',
      price: String(prop.price || ''),
      bhk: String(prop.bhk ?? '3'),
      bathrooms: String(prop.bathrooms ?? '3'),
      size_sqft: String(prop.size_sqft || prop.carpet_area_sqft || ''),
      carpet_area_sqft: String(prop.carpet_area_sqft || ''),
      builtup_area_sqft: String(prop.builtup_area_sqft || ''),
      amenities: Array.isArray(prop.amenities) ? prop.amenities.join(', ') : 'Private Pool, Garden',
      images: existingImages,
    });
    setIsEditModalOpen(true);
  };

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
      amenities: 'Private Pool, Landscaped Garden, 24x7 Security',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error('Please enter title and price');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        title: formData.title,
        name: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        status: formData.status.toLowerCase(),
        location: formData.location || 'Karjat',
        city: 'Karjat',
        price: Number(formData.price),
        bhk: Number(formData.bhk) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        size_sqft: Number(formData.size_sqft || 0),
        amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        images: formData.images,
      };

      if (isEdit) {
        await api.patch(`/properties/${formData.id}`, payload);
        toast.success('Property updated');
        setIsEditModalOpen(false);
      } else {
        await api.post('/properties', payload);
        toast.success('Property added to catalog');
        setIsAddModalOpen(false);
      }
      fetchProperties();
    } catch (err: any) {
      toast.error('Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return '₹ Price on request';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lakhs`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const filteredProperties = properties
    .filter((p) => statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase())
    .filter((p) => typeFilter === 'All' || p.property_type?.toLowerCase() === typeFilter.toLowerCase())
    .filter((p) =>
      (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Verified Property Inventory
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Verified Karjat villas, sanctioned NA plots, and farmhouse estates tied to buyer recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px]">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-[4px] cursor-pointer ${view === 'grid' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs' : 'text-[var(--color-text-muted)]'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-[4px] cursor-pointer ${view === 'table' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs' : 'text-[var(--color-text-muted)]'}`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProperties} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Listing
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {/* Status Filters */}
          <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
            {['All', 'Available', 'Reserved', 'Sold'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
            {['All', 'Villa', 'Plot', 'Farmhouse'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search title, neighborhood..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* CONTENT: GRID VIEW */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[12px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface)]">
              No properties found matching your filters.
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:border-[var(--color-border)]/90 transition-colors cursor-pointer flex flex-col"
              >
                {/* Photo Preview */}
                <div className="h-44 bg-[var(--color-surface-elevated)] relative overflow-hidden">
                  <img
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
                    alt={prop.title || prop.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant={prop.status === 'available' ? 'success' : prop.status === 'reserved' ? 'warm' : 'cold'}>
                      {prop.status || 'Available'}
                    </Badge>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-medium font-display text-[16px] text-[var(--color-text)] tracking-tight truncate">
                        {prop.title || prop.name}
                      </h3>
                      <span className="font-medium font-display text-[15px] text-[var(--color-text)] tabular-nums whitespace-nowrap">
                        {formatPrice(prop.price)}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[var(--color-text-muted)] flex-shrink-0" />
                      <span className="truncate">{prop.location || 'Karjat, Maharashtra'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                    <div>
                      <span className="block text-[10px]">Type</span>
                      <span className="font-medium text-[var(--color-text)] capitalize">{prop.property_type || 'Villa'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">BHK</span>
                      <span className="font-medium text-[var(--color-text)]">{prop.bhk ? `${prop.bhk} BHK` : '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Area</span>
                      <span className="font-medium text-[var(--color-text)] tabular-nums">{prop.size_sqft ? `${prop.size_sqft} sqft` : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] capitalize">
                      Ready for site visit
                    </span>
                    <button
                      onClick={(e) => handleOpenEdit(prop, e)}
                      className="text-[11px] font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONTENT: DENSE TABLE VIEW */}
      {view === 'table' && (
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <th className="py-2.5 px-4 font-medium">Property Name</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">BHK / Area</th>
                  <th className="py-2.5 px-4 font-medium">Valuation</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredProperties.map((prop) => (
                  <tr
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    className="hover:bg-[var(--color-surface-elevated)]/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium font-display text-[14px] text-[var(--color-text)]">
                      {prop.title || prop.name}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[var(--color-text-muted)]">
                      {prop.location || 'Karjat'}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[var(--color-text)] capitalize">
                      {prop.property_type || 'Villa'}
                    </td>
                    <td className="py-3 px-4 text-[12px] font-mono text-[var(--color-text)] tabular-nums">
                      {prop.bhk ? `${prop.bhk} BHK` : ''} {prop.size_sqft ? `· ${prop.size_sqft} sqft` : ''}
                    </td>
                    <td className="py-3 px-4 font-medium font-display text-[14px] text-[var(--color-text)] tabular-nums">
                      {formatPrice(prop.price)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={prop.status === 'available' ? 'success' : prop.status === 'reserved' ? 'warm' : 'cold'}>
                        {prop.status || 'Available'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => handleOpenEdit(prop, e)}
                        className="text-[12px] font-medium text-[var(--color-accent)] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PROPERTY MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Inventory Listing' : 'Add Property Listing'}
        maxWidth="lg"
      >
        <form onSubmit={(e) => handleSubmitForm(e, isEditModalOpen)} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Riverview Luxury Villa"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Price (INR) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="12500000"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="farmhouse">Farmhouse</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">BHK</label>
              <input
                type="number"
                value={formData.bhk}
                onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Area (SqFt)</label>
              <input
                type="number"
                value={formData.size_sqft}
                onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                placeholder="2400"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Location / Neighborhood</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Kashele, Karjat"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isEditModalOpen ? 'Save Changes' : 'Publish Listing'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
