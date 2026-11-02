import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const localNetworkOrigins = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter(
    ({ address, family, internal }) =>
      family === "IPv4" && !internal && isPrivateIpv4Address(address),
  )
  .map(({ address }) => address);

const nextConfig: NextConfig = {
  allowedDevOrigins: [...localNetworkOrigins, "*.ngrok-free.dev"],
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

function isPrivateIpv4Address(address: string) {
  const [first, second] = address.split(".").map(Number);

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
