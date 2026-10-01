import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqgutxucbjjayslgyamm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ3V0eHVjYmpqYXlzbGd5YW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4Mzk5MTUsImV4cCI6MjEwNjQxNTkxNX0.3kJhXnFbJV7m1oXzu5kFHboPV-FqpUDordMxJGNLYvU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const filePath = path.join(process.cwd(), 'public', 'window.svg');
  const buffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase
    .storage
    .from('presentations')
    .upload(`test-${Date.now()}.svg`, buffer, {
      contentType: 'image/svg+xml'
    });

  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}

testUpload();
