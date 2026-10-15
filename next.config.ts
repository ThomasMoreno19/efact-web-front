import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/",
        destination: "/administracion/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
