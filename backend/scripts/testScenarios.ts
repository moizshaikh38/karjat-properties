import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xlngkqmxeteyaiyvpodt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmdrcW14ZXRleWFpeXZwb2R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM0NjcwNCwiZXhwIjoyMTAzOTIyNzA0fQ.HKlaVBRcy7pEh9RjJeHccK0rkC0hOzBQPl2EFi4xRrI';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/fast2sms/whatsapp';
const TEST_PHONE = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function sendWebhook(text: string) {
  console.log(`\n🧑 [USER]: ${text}`);
  await axios.post(WEBHOOK_URL, {
    event: "message_received",
    data: {
      phone_number_id: "372339272638522",
      from: TEST_PHONE,
      message_type: "text",
      text,
      message_id: `test_${Date.now()}`
    }
  });
}

async function getLatestAIResponse(): Promise<string | null> {
  // Wait for AI processing
  await delay(12000); 

  const { data: msgs, error } = await supabase
    .from('whatsapp_messages')
    .select('text_content, direction')
    .or(`sender_phone.eq.+${TEST_PHONE},recipient_phone.eq.+${TEST_PHONE}`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !msgs) return null;
  
  // Find the first outgoing message
  for (const msg of msgs) {
    if (msg.direction === 'outgoing') {
      return msg.text_content;
    }
    // If we hit an incoming message first, it means the outgoing hasn't generated yet or we are too fast.
    if (msg.direction === 'incoming') {
      // Let's wait a bit more and retry once
      await delay(5000);
      const retry = await supabase.from('whatsapp_messages').select('text_content, direction').or(`sender_phone.eq.+${TEST_PHONE},recipient_phone.eq.+${TEST_PHONE}`).order('created_at', { ascending: false }).limit(1);
      if (retry.data?.[0]?.direction === 'outgoing') return retry.data[0].text_content;
      return null;
    }
  }
  return null;
}

async function runTests() {
  console.log(`=== Starting E2E AI Sales Agent Tests on Render ===`);
  console.log(`Test Phone Number: +${TEST_PHONE}\n`);

  const scenarios = [
    "Hi, I am looking for a property",
    "I want a 3BHK villa in Karjat under 80 lakhs",
    "Tell me more about the first property you showed me",
    "Mala udya site visit karaychi ahe", // Marathi for "I want to do a site visit tomorrow"
    "I want to talk to a human agent"
  ];

  for (const text of scenarios) {
    await sendWebhook(text);
    const response = await getLatestAIResponse();
    console.log(`🤖 [AI]: ${response || '(No response or timeout)'}`);
  }

  console.log(`\n=== Tests Complete ===`);
}

runTests();
