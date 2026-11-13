import { store } from './store';
import { useAsync, useSite } from './hooks';
import { summarize } from './utils';

/** Loads everything the admin screens need about members in one go. */
export function useGymData() {
  const site = useSite();
  const res = useAsync(async () => {
    const [members, subs, payments, plans] = await Promise.all([
      store.list('members', { order: ['full_name', 'asc'] }),
      store.list('subscriptions'),
      store.list('payments', { order: ['paid_on', 'desc'] }),
      store.list('plans', { order: ['sort_order', 'asc'] }),
    ]);
    const summaries = members.map((m) => summarize(m, subs, payments));
    return { members, subs, payments, plans, summaries };
  });
  return { ...res, site: site.data };
}
