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
  Share2,
  Calendar,
  Check,
  Compass,
  FileCheck,
  Droplets,
  Zap,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const KARJAT_LOCATIONS = [
  'Kashele, Karjat',
  'Bhilavle, Karjat',
  'Neral-Karjat Road',
  'Bhivpuri, Karjat',
  'Khandpe, Karjat',
  'Kadav, Karjat',
  'Vangani, Karjat',
  'Karjat Station Road',
  'Chouk-Karjat Highway',
  'Tathe, Karjat'
];

const PRESET_AMENITIES = [
  'Private Swimming Pool',
  'Landscaped Lawn & Garden',
  '24x7 Gated Security & CCTV',
  'Borewell + Water Storage',
  '3-Phase Electricity & Power Backup',
  'Compound Wall with Main Gate',
  'Caretaker Room / Staff Quarters',
  'Organic Mango & Fruit Trees',
  'Scenic Mountain View',
  'Riverfront / Stream Access',
  'Internal Tar Road Access',
  'Gazebo & Outdoor Sit-out'
];

const PRESET_PHOTOS = [
  { label: 'Luxury Villa', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
  { label: 'Mountain View Farmhouse', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800' },
  { label: 'Riverfront Estate', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
  { label: 'Sanctioned NA Plot', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800' },
  { label: 'Private Swimming Pool', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800' },
  { label: 'Lawn & Orchard', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
];

export default function Properties() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State with Guntha, Acre, and Full Real Estate Specs
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    property_type: 'villa',
    listing_type: 'sale',
    status: 'available',
    location: 'Kashele, Karjat',
    city: 'Karjat',
    price: '',
    
    // Acre & Guntha Dual Tracking
    acres: '0',
    gunthas: '0',
    area_value: '2400',
    area_unit: 'sqft' as 'sqft' | 'guntha' | 'acre',
    total_calculated_sqft: 2400,

    builtup_area_sqft: '2400',
    carpet_area_sqft: '1800',
    
    // Structure & Configuration
    bhk: '3',
    bathrooms: '3',
    furnishing: 'fully_furnished',
    possession: 'Ready Possession',
    
    // Legal & Land Features (Karjat Specific)
    land_zone: 'Sanctioned NA',
    water_source: 'Private Borewell + River Access',
    electricity: 'MSEDCL 3-Phase + Solar Backup',
    road_access: 'Tar Road Touch',
    facing_view: 'Mountain & River View',
    
    // Amenities & Media
    amenities: ['Private Swimming Pool', 'Landscaped Lawn & Garden', '24x7 Gated Security & CCTV'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
  });

  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

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

  // Format Area for Display (e.g., "2.5 Acres", "10 Guntha", "2,400 Sq.Ft.")
  const formatAreaDisplay = (prop: any) => {
    const sqft = prop.size_sqft || prop.plot_area_sqft || prop.carpet_area_sqft || 0;
    if (!sqft) return '—';

    if (sqft >= 43560) {
      const acres = (sqft / 43560).toFixed(2).replace(/\.00$/, '');
      const gunthas = Math.round(sqft / 1089);
      return `${acres} Acres (${gunthas} Guntha)`;
    }
    if (sqft >= 1089 && (prop.property_type === 'plot' || prop.property_type === 'farmhouse' || sqft < 43560)) {
      const gunthas = (sqft / 1089).toFixed(1).replace(/\.0$/, '');
      return `${gunthas} Guntha (${sqft.toLocaleString()} sqft)`;
    }
    return `${sqft.toLocaleString()} Sq.Ft.`;
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

  // Synchronize Acre + Guntha with Total SqFt
  const updateFromAcreGuntha = (acres: string, gunthas: string) => {
    const numAcres = parseFloat(acres) || 0;
    const numGunthas = parseFloat(gunthas) || 0;
    const totalSqFt = Math.round(numAcres * 43560 + numGunthas * 1089);

    setFormData((prev) => ({
      ...prev,
      acres,
      gunthas,
      total_calculated_sqft: totalSqFt,
      area_value: numAcres > 0 ? acres : numGunthas > 0 ? gunthas : String(totalSqFt),
      area_unit: numAcres > 0 ? 'acre' : numGunthas > 0 ? 'guntha' : 'sqft',
      builtup_area_sqft: prev.property_type === 'plot' ? '0' : prev.builtup_area_sqft,
    }));
  };

  // Synchronize Direct Value & Unit with Acre / Guntha
  const updateFromUnitValue = (val: string, unit: 'sqft' | 'guntha' | 'acre') => {
    const num = parseFloat(val) || 0;
    let totalSqFt = num;
    let calcAcres = '0';
    let calcGunthas = '0';

    if (unit === 'guntha') {
      totalSqFt = Math.round(num * 1089);
      calcGunthas = val;
      calcAcres = (num / 40).toFixed(2).replace(/\.00$/, '');
    } else if (unit === 'acre') {
      totalSqFt = Math.round(num * 43560);
      calcAcres = val;
      calcGunthas = (num * 40).toFixed(1).replace(/\.0$/, '');
    } else {
      totalSqFt = num;
      calcGunthas = (num / 1089).toFixed(1).replace(/\.0$/, '');
      calcAcres = (num / 43560).toFixed(2).replace(/\.00$/, '');
    }

    setFormData((prev) => ({
      ...prev,
      area_value: val,
      area_unit: unit,
      acres: calcAcres,
      gunthas: calcGunthas,
      total_calculated_sqft: totalSqFt,
    }));
  };

  // Upload Local Photo Files From Device
  const handleSystemFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, dataUrl],
          }));
          addedCount++;
          if (addedCount === files.length) {
            toast.success(`Added ${addedCount} photo(s) from your device`);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleOpenAdd = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      property_type: 'villa',
      listing_type: 'sale',
      status: 'available',
      location: 'Kashele, Karjat',
      city: 'Karjat',
      price: '',
      acres: '0',
      gunthas: '2.2',
      area_value: '2400',
      area_unit: 'sqft',
      total_calculated_sqft: 2400,
      builtup_area_sqft: '2400',
      carpet_area_sqft: '1800',
      bhk: '3',
      bathrooms: '3',
      furnishing: 'fully_furnished',
      possession: 'Ready Possession',
      land_zone: 'Sanctioned NA',
      water_source: 'Private Borewell + River Access',
      electricity: 'MSEDCL 3-Phase + Power Backup',
      road_access: 'Tar Road Touch',
      facing_view: 'Mountain & River View',
      amenities: ['Private Swimming Pool', 'Landscaped Lawn & Garden', '24x7 Gated Security & CCTV'],
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prop: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPropertyToEdit(prop);
    
    const rawSqFt = prop.size_sqft || prop.plot_area_sqft || prop.carpet_area_sqft || 2400;
    const calcAcres = (rawSqFt / 43560).toFixed(2).replace(/\.00$/, '');
    const calcGunthas = (rawSqFt / 1089).toFixed(1).replace(/\.0$/, '');

    let initialUnit: 'sqft' | 'guntha' | 'acre' = 'sqft';
    let initialVal = String(rawSqFt);

    if (rawSqFt >= 43560) {
      initialUnit = 'acre';
      initialVal = calcAcres;
    } else if (rawSqFt >= 1089 && prop.property_type === 'plot') {
      initialUnit = 'guntha';
      initialVal = calcGunthas;
    }

    setFormData({
      id: prop.id,
      title: prop.title || prop.name || '',
      description: prop.description || '',
      property_type: prop.property_type || 'villa',
      listing_type: prop.listing_type || 'sale',
      status: (prop.status || 'available').toLowerCase(),
      location: prop.location || 'Kashele, Karjat',
      city: 'Karjat',
      price: String(prop.price || ''),
      acres: calcAcres,
      gunthas: calcGunthas,
      area_value: initialVal,
      area_unit: initialUnit,
      total_calculated_sqft: rawSqFt,
      builtup_area_sqft: String(prop.builtup_area_sqft || prop.size_sqft || ''),
      carpet_area_sqft: String(prop.carpet_area_sqft || ''),
      bhk: String(prop.bhk ?? '3'),
      bathrooms: String(prop.bathrooms ?? '3'),
      furnishing: prop.furnished_status || 'fully_furnished',
      possession: prop.possession_date || 'Ready Possession',
      land_zone: 'Sanctioned NA',
      water_source: 'Private Borewell',
      electricity: 'MSEDCL 3-Phase',
      road_access: 'Tar Road Touch',
      facing_view: 'Mountain View',
      amenities: Array.isArray(prop.amenities) ? prop.amenities : ['Private Swimming Pool', '24x7 Security'],
      images: prop.images?.length ? prop.images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      return toast.error('Please enter property title and price');
    }

    try {
      setIsSubmitting(true);
      const totalSqFt = formData.total_calculated_sqft || 2400;

      const payload: any = {
        title: formData.title,
        name: formData.title,
        description: formData.description || `${formData.property_type === 'plot' ? `${formData.gunthas} Guntha Sanctioned NA Plot` : `${formData.bhk} BHK ${formData.property_type}`} in ${formData.location}. ${formData.land_zone}, ${formData.water_source}, ${formData.facing_view}.`,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        status: formData.status.toLowerCase(),
        location: formData.location,
        city: 'Karjat',
        price: Number(formData.price),
        bhk: formData.property_type === 'plot' ? 0 : Number(formData.bhk) || 0,
        bathrooms: formData.property_type === 'plot' ? 0 : Number(formData.bathrooms) || 0,
        size_sqft: totalSqFt,
        plot_area_sqft: totalSqFt,
        builtup_area_sqft: Number(formData.builtup_area_sqft) || (formData.property_type === 'plot' ? 0 : totalSqFt),
        carpet_area_sqft: Number(formData.carpet_area_sqft) || (formData.property_type === 'plot' ? 0 : Math.round(totalSqFt * 0.75)),
        furnished_status: formData.furnishing,
        amenities: formData.amenities,
        images: formData.images,
      };

      if (isEdit) {
        await api.patch(`/properties/${formData.id}`, payload);
        toast.success('Property listing updated');
        setIsEditModalOpen(false);
      } else {
        await api.post('/properties', payload);
        toast.success('New property added to inventory');
        setIsAddModalOpen(false);
      }
      fetchProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addPhotoPreset = (url: string) => {
    if (!formData.images.includes(url)) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const addCustomPhoto = () => {
    if (customPhotoUrl.trim() && !formData.images.includes(customPhotoUrl.trim())) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, customPhotoUrl.trim()] }));
      setCustomPhotoUrl('');
    }
  };

  const removePhoto = (url: string) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
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
            Karjat Real Estate Inventory
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Verified luxury villas, sanctioned NA plots (Guntha / Acres), and riverfront farmhouse estates.
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
            Add Property
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
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
            placeholder="Search Kashele, Guntha, Acre, Villa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[12px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface)]">
              No properties found matching your criteria.
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:border-[var(--color-border)]/90 transition-colors cursor-pointer flex flex-col"
              >
                {/* Image Showcase */}
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

                {/* Details */}
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

                  {/* Area (Guntha / Acre / SqFt) + Config Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                    <div>
                      <span className="block text-[10px]">Type</span>
                      <span className="font-medium text-[var(--color-text)] capitalize">{prop.property_type || 'Villa'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Config</span>
                      <span className="font-medium text-[var(--color-text)]">{prop.bhk ? `${prop.bhk} BHK` : 'Plot'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Land / Area</span>
                      <span className="font-medium text-[var(--color-text)] tabular-nums truncate block">
                        {formatAreaDisplay(prop)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-accent)]" />
                      <span>7/12 Clear Title</span>
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

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <th className="py-2.5 px-4 font-medium">Property Title</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Land Area (Acre/Guntha/SqFt)</th>
                  <th className="py-2.5 px-4 font-medium">BHK</th>
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
                      {formatAreaDisplay(prop)}
                    </td>
                    <td className="py-3 px-4 text-[12px] font-mono text-[var(--color-text)]">
                      {prop.bhk ? `${prop.bhk} BHK` : '—'}
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

      {/* RICH PROPERTY DOSSIER MODAL */}
      {selectedProperty && (
        <Modal
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          title={selectedProperty.title || selectedProperty.name}
          maxWidth="lg"
        >
          <div className="space-y-4 text-[13px]">
            {/* Main Photo Gallery */}
            <div className="h-56 bg-[var(--color-surface-elevated)] rounded-[6px] overflow-hidden relative">
              <img
                src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge variant="success">
                  {selectedProperty.status || 'Available'}
                </Badge>
              </div>
            </div>

            {/* Price & Location Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[var(--color-surface-elevated)]/60 rounded-[6px] border border-[var(--color-border)]">
              <div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Valuation</span>
                <span className="text-[20px] font-medium font-display text-[var(--color-text)]">
                  {formatPrice(selectedProperty.price)}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-[var(--color-text-muted)] block">Location & Zone</span>
                <span className="font-medium text-[var(--color-text)]">{selectedProperty.location || 'Kashele, Karjat'} (Sanctioned NA)</span>
              </div>
            </div>

            {/* Key Measurements (Acre / Guntha / SqFt) */}
            <div className="grid grid-cols-3 gap-3 p-3 border border-[var(--color-border)] rounded-[6px]">
              <div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Plot / Land Area</span>
                <span className="font-medium text-[var(--color-text)]">{formatAreaDisplay(selectedProperty)}</span>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Configuration</span>
                <span className="font-medium text-[var(--color-text)]">{selectedProperty.bhk ? `${selectedProperty.bhk} BHK Villa` : 'Plot'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Water & Power</span>
                <span className="font-medium text-[var(--color-text)]">Borewell + 3-Phase</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Property Description</span>
              <p className="text-[12.5px] text-[var(--color-text)] leading-relaxed bg-[var(--color-surface-elevated)]/30 p-3 rounded-[6px] border border-[var(--color-border)]">
                {selectedProperty.description || 'Premium real estate investment opportunity in Karjat with scenic mountain views and ready road connectivity.'}
              </p>
            </div>

            {/* Amenities Grid */}
            <div>
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1.5">Amenities & Highlights</span>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(selectedProperty.amenities) ? selectedProperty.amenities : PRESET_AMENITIES.slice(0, 6)).map((a: string) => (
                  <span key={a} className="px-2 py-1 bg-[var(--color-surface-elevated)] text-[var(--color-text)] rounded-[4px] text-[11px] border border-[var(--color-border)]">
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProperty(null);
                  handleOpenEdit(selectedProperty);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Listing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/site-visits')}
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
              >
                Schedule Site Visit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPREHENSIVE ADD / EDIT PROPERTY MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Karjat Property Listing' : 'Add New Property Listing'}
        maxWidth="xl"
      >
        <form onSubmit={(e) => handleSubmitForm(e, isEditModalOpen)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 hide-scrollbar">
          
          {/* SECTION 1: BASIC DETAILS */}
          <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-3 bg-[var(--color-surface)]">
            <span className="text-[12px] font-medium text-[var(--color-text)] block">1. Basic Property Information</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Riverview Luxury Villa 3BHK"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      property_type: newType,
                      bhk: newType === 'plot' ? '0' : prev.bhk || '3',
                      builtup_area_sqft: newType === 'plot' ? '0' : prev.builtup_area_sqft,
                    }));
                  }}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
                >
                  <option value="villa">Luxury Villa / Bungalow</option>
                  <option value="plot">Sanctioned NA Plot (Guntha / Acres)</option>
                  <option value="farmhouse">Farmhouse Estate</option>
                  <option value="apartment">Residential Apartment</option>
                  <option value="commercial">Commercial / Resort Land</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Total Price (INR) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 12500000 (₹1.25 Cr)"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Karjat Location / Village *</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
                >
                  {KARJAT_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROMINENT ACRE & GUNTHA LAND MEASUREMENTS */}
          <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-3 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[var(--color-text)]">
                  2. Land Measurement (Acre & Guntha)
                </span>
                {formData.property_type === 'plot' && (
                  <span className="px-1.5 py-0.5 bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-medium rounded border border-[var(--color-accent)]/30">
                    Plot / Land Mode
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--color-accent)] font-mono hidden sm:inline">
                1 Acre = 40 Guntha = 43,560 sqft | 1 Guntha = 1,089 sqft
              </span>
            </div>

            {/* Direct Acre & Guntha Dual Input Row for Plots / Land */}
            <div className="p-3 bg-[var(--color-surface-elevated)]/70 rounded-[6px] border border-[var(--color-border)] space-y-3">
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">
                Specify Land Size in Acres & Gunthas:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text)] mb-1">
                    Acres (एकर)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.acres}
                    onChange={(e) => updateFromAcreGuntha(e.target.value, formData.gunthas)}
                    placeholder="e.g. 1.5"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text)] mb-1">
                    Gunthas (गुंठा)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.gunthas}
                    onChange={(e) => updateFromAcreGuntha(formData.acres, e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                    Calculated Total Land Area
                  </label>
                  <div className="h-9 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] flex items-center justify-between text-[12px] font-mono text-[var(--color-accent)] font-medium tabular-nums">
                    <span>{formData.total_calculated_sqft.toLocaleString()} Sq.Ft.</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      ({(formData.total_calculated_sqft / 1089).toFixed(1)} Guntha)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Unit Converter Alternative */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                  Or Direct Measurement Entry:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={formData.area_value}
                    onChange={(e) => updateFromUnitValue(e.target.value, formData.area_unit)}
                    placeholder="2400"
                    className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                  />
                  <select
                    value={formData.area_unit}
                    onChange={(e) => updateFromUnitValue(formData.area_value, e.target.value as any)}
                    className="w-32 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="sqft">Sq.Ft.</option>
                    <option value="guntha">Guntha (गुंठा)</option>
                    <option value="acre">Acre (एकर)</option>
                  </select>
                </div>
              </div>

              {formData.property_type !== 'plot' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Built-up (SqFt)</label>
                    <input
                      type="number"
                      value={formData.builtup_area_sqft}
                      onChange={(e) => setFormData({ ...formData, builtup_area_sqft: e.target.value })}
                      className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Carpet (SqFt)</label>
                    <input
                      type="number"
                      value={formData.carpet_area_sqft}
                      onChange={(e) => setFormData({ ...formData, carpet_area_sqft: e.target.value })}
                      className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-[12px] text-[var(--color-text-muted)] p-2 bg-[var(--color-surface-elevated)]/40 rounded-[6px] border border-[var(--color-border)]">
                  <span>✓ 100% Clear Title NA Sanctioned Plot Layout with Demarcation Stones</span>
                </div>
              )}
            </div>

            {formData.property_type !== 'plot' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]/50">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">BHK Configuration</label>
                  <select
                    value={formData.bhk}
                    onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK Estate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: LEGAL, WATER, POWER & ROAD SPECS */}
          <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-3 bg-[var(--color-surface)]">
            <span className="text-[12px] font-medium text-[var(--color-text)] block">3. Legal, Zone & Infrastructure Specs</span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Land Zone / Legal</label>
                <select
                  value={formData.land_zone}
                  onChange={(e) => setFormData({ ...formData, land_zone: e.target.value })}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                >
                  <option value="Sanctioned NA">Sanctioned NA (Non-Agricultural)</option>
                  <option value="Collector Approved NA">Collector Approved NA</option>
                  <option value="R-Zone (Residential)">R-Zone (Residential)</option>
                  <option value="Agricultural / Farmhouse">Agricultural / Farmhouse Zone</option>
                  <option value="7/12 Clear Title">7/12 Clear Title</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Water Source</label>
                <select
                  value={formData.water_source}
                  onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                >
                  <option value="Private Borewell + River Access">Private Borewell + River Access</option>
                  <option value="Borewell + Gram Panchayat">Borewell + Gram Panchayat Line</option>
                  <option value="Riverfront Access">Direct Riverfront / Stream Access</option>
                  <option value="Well (Bawdi) Water">Perennial Water Well (Bawdi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Electricity Connection</label>
                <select
                  value={formData.electricity}
                  onChange={(e) => setFormData({ ...formData, electricity: e.target.value })}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                >
                  <option value="MSEDCL 3-Phase + Power Backup">MSEDCL 3-Phase + Power Backup</option>
                  <option value="MSEDCL Single Phase">MSEDCL Single Phase</option>
                  <option value="Solar Power System">Complete Solar Power Grid</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: AMENITIES PICKER */}
          <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-2.5 bg-[var(--color-surface)]">
            <span className="text-[12px] font-medium text-[var(--color-text)] block">4. Select Verified Amenities</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-2.5 py-1 rounded-[4px] text-[12px] transition-colors cursor-pointer select-none border ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                        : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: SYSTEM PHOTO UPLOAD & PRESET MEDIA */}
          <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-3 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--color-text)] block">
                5. Property Photos & System File Upload
              </span>
              <span className="text-[11px] text-[var(--color-accent)]">
                {formData.images.length} photo(s) attached
              </span>
            </div>

            {/* UPLOAD FROM SYSTEM / COMPUTER BUTTON & DRAG-AND-DROP */}
            <div className="p-4 bg-[var(--color-surface-elevated)]/60 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors rounded-[6px] text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleSystemFileUpload}
                className="hidden"
              />
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent)]">
                  <Upload className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text)]">
                  Upload photos from your computer or phone
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Supports JPG, PNG, WEBP files directly from local storage
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
              >
                Browse Device Files
              </Button>
            </div>

            {/* Quick Photo Presets */}
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mb-1.5">Or Select HD Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((p) => (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => addPhotoPreset(p.url)}
                    className="px-2 py-0.5 bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:border-[var(--color-accent)] border border-[var(--color-border)] rounded-[4px] text-[11px] cursor-pointer"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Photo URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="Or paste image link (https://...)"
                className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[12px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomPhoto}>
                Add Link
              </Button>
            </div>

            {/* Selected Photo Thumbnails */}
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-12 rounded-[4px] overflow-hidden border border-[var(--color-border)] group">
                  <img src={img} alt="Property" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(img)}
                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-[2px] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
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
              {isEditModalOpen ? 'Save Property Changes' : 'Publish to Verified Inventory'}
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
