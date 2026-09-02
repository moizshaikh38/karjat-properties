-- ==========================================
-- 001_development_seed.sql
-- DEVELOPMENT DATA ONLY
-- ==========================================

-- 1. Insert 5 sample amenities
INSERT INTO amenities (id, name) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Swimming Pool'),
    ('a2222222-2222-2222-2222-222222222222', 'Private Garden'),
    ('a3333333-3333-3333-3333-333333333333', 'Security 24x7'),
    ('a4444444-4444-4444-4444-444444444444', 'Power Backup'),
    ('a5555555-5555-5555-5555-555555555555', 'Mountain View')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert 3 sample properties in Karjat
INSERT INTO properties (
    id, property_code, title, description, property_type, listing_type, status, 
    location, city, area, address, price, bhk, bathrooms, carpet_area_sqft, 
    builtup_area_sqft, furnished_status, developer_name, rera_number, possession_date
) VALUES
(
    'p1111111-1111-1111-1111-111111111111', 
    'KP-VIL-001', 
    'Luxury Riverfront Villa in Karjat', 
    'A stunning 3 BHK villa with a private garden and river views.', 
    'villa', 
    'sale', 
    'available', 
    'Bhilavle', 
    'Karjat', 
    'Bhilavle', 
    'Riverfront Estate, Bhilavle, Karjat', 
    12500000.00, 
    3, 
    3, 
    1800.00, 
    2200.00, 
    'fully_furnished', 
    'Riverfront Developers', 
    'P9900000001', 
    '2023-12-01'
),
(
    'p2222222-2222-2222-2222-222222222222', 
    'KP-APT-002', 
    'Scenic Mountain View 2BHK Apartment', 
    'Modern 2 BHK apartment near Karjat Station with excellent connectivity.', 
    'apartment', 
    'sale', 
    'available', 
    'Dahivali', 
    'Karjat', 
    'Dahivali', 
    'Mountain Heights, Dahivali, Karjat', 
    4500000.00, 
    2, 
    2, 
    750.00, 
    950.00, 
    'unfurnished', 
    'Heights Realty', 
    'P9900000002', 
    '2024-06-01'
),
(
    'p3333333-3333-3333-3333-333333333333', 
    'KP-FRM-003', 
    'Spacious Farmhouse with Private Pool', 
    'A huge 4 BHK farmhouse ideal for weekend getaways.', 
    'farmhouse', 
    'sale', 
    'available', 
    'Khandpe', 
    'Karjat', 
    'Khandpe', 
    'Green Acres, Khandpe, Karjat', 
    25000000.00, 
    4, 
    5, 
    3500.00, 
    4000.00, 
    'semi_furnished', 
    'Green Acres Developers', 
    'P9900000003', 
    '2022-01-15'
)
ON CONFLICT (property_code) DO NOTHING;

-- 3. Insert property media using placeholder URLs
INSERT INTO property_media (property_id, media_type, url, title, is_primary) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'image', 'https://via.placeholder.com/800x600.png?text=Villa+Front+View', 'Front View', true),
    ('p1111111-1111-1111-1111-111111111111', 'image', 'https://via.placeholder.com/800x600.png?text=Villa+Living+Room', 'Living Room', false),
    ('p2222222-2222-2222-2222-222222222222', 'image', 'https://via.placeholder.com/800x600.png?text=Apartment+Balcony', 'Balcony View', true),
    ('p3333333-3333-3333-3333-333333333333', 'image', 'https://via.placeholder.com/800x600.png?text=Farmhouse+Pool', 'Private Pool', true);

-- 4. Property-amenity relationships
INSERT INTO property_amenities (property_id, amenity_id) VALUES
    -- Villa has Garden, Security, Mountain View
    ('p1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222'),
    ('p1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333'),
    ('p1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555'),
    
    -- Apartment has Security, Power Backup, Mountain View
    ('p2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333'),
    ('p2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444'),
    ('p2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555'),
    
    -- Farmhouse has Pool, Garden, Power Backup, Mountain View
    ('p3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111'),
    ('p3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222'),
    ('p3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444'),
    ('p3333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;
