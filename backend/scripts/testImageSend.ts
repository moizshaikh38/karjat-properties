/**
 * Quick test: Send an image via Fast2SMS WhatsApp Session API
 * Run: npx tsx scripts/testImageSend.ts
 */
import axios from 'axios';

const API_KEY = process.env.FAST2SMS_API_KEY || 'dXR9bpkPeK20aryu8qIvitZoTjH45S3DxJsG16gWAcQzNnMFOUbgj0E4HytFn2RPSeWULi79Xz5Mslvo';
const TO = '917219311866';
const IMAGE_URL = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';
const CAPTION = '📸 Test: Luxury Riverfront Villa in Karjat';

async function testImageSend() {
  const base = 'https://www.fast2sms.com';

  // --- Test 1: top-level url + display_number in body ---
  console.log('=== Test 1: url in body + display_number in body ===');
  try {
    const res = await axios.post(`${base}/dev/whatsapp-session?to=${TO}`, {
      type: 'image',
      url: IMAGE_URL,
      text: CAPTION,
      display_number: TO,   // use recipient as display for discovery
    }, {
      headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('FAILED:', err.response?.status, JSON.stringify(err.response?.data, null, 2));
  }

  // --- Test 2: top-level url + phone_number_id in query ---
  console.log('\n=== Test 2: url in body, phone_number_id in query ===');
  try {
    const res = await axios.post(`${base}/dev/whatsapp-session?to=${TO}&phone_number_id=test`, {
      type: 'image',
      url: IMAGE_URL,
      text: CAPTION,
    }, {
      headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('FAILED:', err.response?.status, JSON.stringify(err.response?.data, null, 2));
  }

  // --- Test 3: url + phone_number_id both in body ---
  console.log('\n=== Test 3: url + phone_number_id both in body ===');
  try {
    const res = await axios.post(`${base}/dev/whatsapp-session?to=${TO}`, {
      type: 'image',
      url: IMAGE_URL,
      text: CAPTION,
      phone_number_id: 'test-id',
    }, {
      headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('FAILED:', err.response?.status, JSON.stringify(err.response?.data, null, 2));
  }

  // --- Test 4: image.link (Meta format) + phone_number_id in body ---
  console.log('\n=== Test 4: image.link (Meta format) + phone_number_id + url in body ===');
  try {
    const res = await axios.post(`${base}/dev/whatsapp-session?to=${TO}`, {
      type: 'image',
      image: { link: IMAGE_URL, caption: CAPTION },
      url: IMAGE_URL,
      phone_number_id: 'test-id',
    }, {
      headers: { Authorization: API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('FAILED:', err.response?.status, JSON.stringify(err.response?.data, null, 2));
  }
}

testImageSend();
