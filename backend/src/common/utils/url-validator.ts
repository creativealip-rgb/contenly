import { BadRequestException } from '@nestjs/common';
import { URL } from 'url';
import * as net from 'net';
import * as dns from 'dns/promises';

const BLOCKED_RANGES = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '0.0.0.0/8',
  '::1/128',
  'fc00::/7',
  'fe80::/10',
];

function ipInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);

  if (net.isIPv4(ip) && net.isIPv4(range)) {
    const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
    const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
    const maskNum = (~0 << (32 - mask)) >>> 0;
    return (ipNum & maskNum) === (rangeNum & maskNum);
  }
  return false;
}

function isPrivateIP(ip: string): boolean {
  return BLOCKED_RANGES.some((cidr) => ipInCIDR(ip, cidr));
}

export async function validateUrlSafe(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Only HTTP/HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname;

  // Block direct IP access to private ranges
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new BadRequestException('Access to internal networks is not allowed');
    }
    return parsed;
  }

  // Resolve DNS and check resolved IPs
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        throw new BadRequestException('Access to internal networks is not allowed');
      }
    }
  } catch (err: any) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException(`Cannot resolve hostname: ${hostname}`);
  }

  return parsed;
}
