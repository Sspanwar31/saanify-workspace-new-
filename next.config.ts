import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Injecting keys globally so they persist across restarts
    NEXT_PUBLIC_SUPABASE_URL: "https://cgntcihiwlzwkurkkarr.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbnRjaWhpd2x6d2t1cmtrYXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTU1OTYsImV4cCI6MjA4MTczMTU5Nn0.dstZK8H1dvGuQVvKPe1RKPIm9l-3QYeoEaMnpjbkrtc",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbnRjaWhpd2x6d2t1cmtrYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsInBhdCI6MTc2NjE1NTU5Niwicm9sZSI6ImFkbWluIn0.8QhLl9zBhVrJqQ3RNdQ7wB3V7HhR1sC1vQG3wBhVlH7fzY"
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;