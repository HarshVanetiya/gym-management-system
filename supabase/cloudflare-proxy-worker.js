// Cloudflare Worker that forwards requests to your Supabase project.
// Why: some Indian ISPs have blocked *.supabase.co. Members' phones then only talk
// to YOUR domain (e.g. api.yourgym.in), which stays reachable.
//
// Setup (free plan is enough, 100k requests/day):
//  1. Cloudflare dashboard → Workers & Pages → Create Worker → paste this file.
//  2. Settings → Variables: SUPABASE_URL = https://YOUR-PROJECT.supabase.co
//  3. Settings → Domains & Routes → add custom domain api.yourgym.in
//  4. In the website build, set VITE_SUPABASE_URL=https://api.yourgym.in
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, env.SUPABASE_URL);
    const proxied = new Request(target, request);
    proxied.headers.delete('host');
    return fetch(proxied);
  },
};
