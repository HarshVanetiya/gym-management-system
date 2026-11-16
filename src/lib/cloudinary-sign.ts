import { createHash } from 'node:crypto';

/**
 * Cloudinary upload signature: sort the parameters by name, join as key=value with "&",
 * append the API secret, SHA-1 hex. (file, api_key, cloud_name and resource_type are never signed.)
 * Server-only: needs the API secret.
 */
export function signCloudinaryParams(params: Record<string, string | number | boolean>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
