import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/exams", destination: "/dashboard", permanent: true },
      { source: "/quiz", destination: "/dashboard", permanent: true },
      { source: "/coding", destination: "/dashboard", permanent: true },
      { source: "/ai-tutor", destination: "/dashboard", permanent: true },
      { source: "/topics/:path*", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
