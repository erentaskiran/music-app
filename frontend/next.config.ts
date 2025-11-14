import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [new URL('https://www.groundguitar.com/wp-content/uploads/2024/02/Nirvana-Nevermind-Coolest-Rock-Album-Covers-1024x1024.jpeg')],
  },
};

export default nextConfig;
