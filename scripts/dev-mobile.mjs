import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const host = process.env.DEV_HOST?.trim() || getLocalNetworkAddress();

if (!host) {
  console.error(
    'No se encontró una IP privada IPv4. Definí DEV_HOST con la IP local de esta computadora.',
  );
  process.exit(1);
}

const nextCli = resolve(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const nextProcess = spawn(
  process.execPath,
  [
    nextCli,
    'dev',
    '--experimental-https',
    '--hostname',
    host,
    '--port',
    process.env.PORT || '3001',
  ],
  { cwd: projectRoot, stdio: 'inherit' },
);

nextProcess.on('error', (error) => {
  console.error('No se pudo iniciar Next.js:', error);
  process.exitCode = 1;
});

nextProcess.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 1;
});

function getLocalNetworkAddress() {
  const addresses = Object.entries(networkInterfaces()).flatMap(
    ([name, networkAddresses]) =>
      (networkAddresses ?? [])
        .filter(
          ({ address, family, internal }) =>
            family === 'IPv4' && !internal && isPrivateIpv4Address(address),
        )
        .map(({ address }) => ({ name, address })),
  );

  const wifiAddress = addresses.find(({ name }) => /wi-?fi|wireless|wlan/i.test(name));
  if (wifiAddress) return wifiAddress.address;

  const commonLanAddress = addresses.find(({ address }) => address.startsWith('192.168.'));
  if (commonLanAddress) return commonLanAddress.address;

  return addresses[0]?.address ?? null;
}

function isPrivateIpv4Address(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
