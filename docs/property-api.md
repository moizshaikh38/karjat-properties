# Property Management API Documentation

## Overview

The Property Management API provides CRUD operations for managing real estate properties, media, and amenities for Karjat Properties. This API will later be consumed by the CRM frontend, WhatsApp AI agent, website, and property recommendation engine.

## Base URL

```
http://localhost:7001/api
```

---

## Authentication

> **Note:** Authentication is not yet implemented. When ready, endpoints will require JWT Bearer tokens and role-based access control:
>
> | Role    | Permissions                                                    |
> |---------|----------------------------------------------------------------|
> | Admin   | Create, update, delete, status update, media, amenities        |
> | Manager | Create, update, status update, media                           |
> | Agent   | Read, search                                                   |

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Error Codes

| Code                    | HTTP | Description                       |
|-------------------------|------|-----------------------------------|
| `VALIDATION_ERROR`      | 400  | Invalid input data                |
| `NOT_FOUND`             | 404  | Resource not found                |
| `PROPERTY_CODE_EXISTS`  | 409  | Duplicate property code           |
| `INVALID_AMENITIES`     | 400  | One or more amenity IDs not found |
| `PROPERTY_MEDIA_NOT_FOUND` | 404 | Media item not found            |
| `INTERNAL_SERVER_ERROR` | 500  | Unexpected server error           |

---

## Endpoints

### 1. Create Property

```
POST /api/properties
```

**Request Body:**

```json
{
  "property_code": "KP-VILLA-001",
  "title": "Luxury 3 BHK Villa in Karjat",
  "description": "Premium villa surrounded by nature.",
  "property_type": "villa",
  "listing_type": "sale",
  "status": "available",
  "location": "Karjat",
  "city": "Karjat",
  "area": "Neral Road",
  "price": 8500000,
  "bhk": 3,
  "bathrooms": 3,
  "carpet_area_sqft": 1800,
  "plot_area_sqft": 3000,
  "furnished_status": "fully_furnished",
  "developer_name": "Example Developer",
  "rera_number": "P00000000000"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "property": { ... }
  }
}
```

**Validation Rules:**

| Field            | Required | Constraints                                                                    |
|------------------|----------|--------------------------------------------------------------------------------|
| property_code    | Yes      | Unique, max 50 chars                                                           |
| title            | Yes      | Max 500 chars                                                                  |
| property_type    | Yes      | `villa`, `apartment`, `flat`, `plot`, `bungalow`, `farmhouse`, `commercial`, `other` |
| listing_type     | Yes      | `sale`, `rent`, `lease`                                                        |
| location         | Yes      | Max 500 chars                                                                  |
| price            | No       | >= 0                                                                           |
| price_min        | No       | >= 0, must be <= price_max                                                     |
| price_max        | No       | >= 0                                                                           |
| bhk              | No       | Integer >= 0                                                                   |
| bathrooms        | No       | Integer >= 0                                                                   |
| latitude         | No       | -90 to 90                                                                      |
| longitude        | No       | -180 to 180                                                                    |
| furnished_status | No       | `unfurnished`, `semi_furnished`, `fully_furnished`                             |
| status           | No       | `available`, `reserved`, `sold`, `rented`, `inactive`                          |

---

### 2. List Properties

```
GET /api/properties
```

**Query Parameters:**

| Parameter      | Type   | Default      | Description                          |
|----------------|--------|--------------|--------------------------------------|
| page           | int    | 1            | Page number                          |
| limit          | int    | 20 (max 100) | Items per page                       |
| status         | string | —            | Filter by status                     |
| property_type  | string | —            | Filter by property type              |
| listing_type   | string | —            | Filter by listing type               |
| city           | string | —            | Case-insensitive partial match       |
| location       | string | —            | Case-insensitive partial match       |
| bhk            | int    | —            | Exact match                          |
| min_price      | number | —            | Minimum price                        |
| max_price      | number | —            | Maximum price                        |
| min_area       | number | —            | Min carpet area sqft                 |
| max_area       | number | —            | Max carpet area sqft                 |
| sort           | string | created_at   | Sort column                          |
| order          | string | desc         | `asc` or `desc`                      |

**Example:**

```
GET /api/properties?city=Karjat&property_type=villa&max_price=10000000
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "properties": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### 3. Search Properties

```
GET /api/properties/search
```

Same query parameters as List, plus:

| Parameter | Type   | Description                                 |
|-----------|--------|---------------------------------------------|
| amenities | string | Comma-separated amenity names to filter by  |

**Key Differences from List:**
- Defaults to `status=available` when not specified.
- Returns a compact result set (no full description).
- Includes `primary_image` and `amenities` array.

**Example:**

```
GET /api/properties/search?city=Karjat&property_type=villa&bhk=3&max_price=9000000&amenities=Swimming Pool,Mountain View
```

**Future AI Usage:**
```typescript
// The AI agent will convert natural language to this:
searchProperties({
  city: "Karjat",
  propertyType: "villa",
  bhk: 3,
  minPrice: 5000000,
  maxPrice: 9000000,
  amenities: ["Swimming Pool"]
})
```

---

### 4. Get Property Details

```
GET /api/properties/:id
```

Returns full property details including media and amenities.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "property": {
      "id": "...",
      "property_code": "...",
      "title": "...",
      "description": "...",
      "media": [ ... ],
      "amenities": [ ... ]
    }
  }
}
```

---

### 5. Update Property

```
PATCH /api/properties/:id
```

Partial updates supported.

**Example Request:**

```json
{
  "price": 8200000,
  "description": "Updated description"
}
```

---

### 6. Delete (Deactivate) Property

```
DELETE /api/properties/:id
```

**Soft deletes** the property by setting `status = "inactive"`.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Property deactivated successfully"
  }
}
```

---

### 7. Update Property Status

```
PATCH /api/properties/:id/status
```

**Request:**

```json
{
  "status": "sold"
}
```

**Allowed values:** `available`, `reserved`, `sold`, `rented`, `inactive`

---

### 8. Property Media

#### List Media

```
GET /api/properties/:id/media
```

#### Add Media

```
POST /api/properties/:id/media
```

**Request:**

```json
{
  "media_type": "image",
  "url": "https://example.com/photo.jpg",
  "title": "Front View",
  "sort_order": 0,
  "is_primary": true
}
```

**Allowed media_type:** `image`, `video`, `brochure`, `document`

#### Delete Media

```
DELETE /api/properties/:id/media/:mediaId
```

---

### 9. Property Amenities

#### List Amenities

```
GET /api/properties/:id/amenities
```

#### Set Amenities (Replace)

```
PUT /api/properties/:id/amenities
```

**Request:**

```json
{
  "amenity_ids": [
    "a1111111-1111-1111-1111-111111111111",
    "a2222222-2222-2222-2222-222222222222"
  ]
}
```

All IDs are validated — returns `INVALID_AMENITIES` if any ID does not exist.

---

## Testing with curl

```bash
# Health check
curl http://localhost:7001/api/health

# Create property
curl -X POST http://localhost:7001/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "property_code": "KP-VILLA-001",
    "title": "Luxury 3 BHK Villa",
    "property_type": "villa",
    "listing_type": "sale",
    "location": "Karjat",
    "price": 8500000,
    "bhk": 3,
    "bathrooms": 3,
    "carpet_area_sqft": 1800
  }'

# List properties
curl "http://localhost:7001/api/properties?city=Karjat&property_type=villa"

# Search properties
curl "http://localhost:7001/api/properties/search?bhk=3&max_price=9000000"

# Get property
curl http://localhost:7001/api/properties/<property-id>

# Update property
curl -X PATCH http://localhost:7001/api/properties/<property-id> \
  -H "Content-Type: application/json" \
  -d '{"price": 8200000}'

# Update status
curl -X PATCH http://localhost:7001/api/properties/<property-id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}'

# Delete (deactivate) property
curl -X DELETE http://localhost:7001/api/properties/<property-id>

# Add media
curl -X POST http://localhost:7001/api/properties/<property-id>/media \
  -H "Content-Type: application/json" \
  -d '{
    "media_type": "image",
    "url": "https://example.com/photo.jpg",
    "title": "Front View",
    "is_primary": true
  }'

# Set amenities
curl -X PUT http://localhost:7001/api/properties/<property-id>/amenities \
  -H "Content-Type: application/json" \
  -d '{"amenity_ids": ["a1111111-1111-1111-1111-111111111111"]}'
```
