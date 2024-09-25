import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vzgnmguzlqsieveyduxs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z25tZ3V6bHFzaWV2ZXlkdXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ0MDUyNDUsImV4cCI6MjAzOTk4MTI0NX0.FT1SqvsIyz8Mj3oq1NCaRO29ux1OPY7e7Q27fhrjsaU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 1, // Configurazione opzionale per il numero di eventi per secondo
    },
  },
});
