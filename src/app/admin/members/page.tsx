import { Suspense } from 'react';
import Members from '../../../views/admin/Members';
import { Loading } from '../../../components/ui';

export default function Page() {
  // useSearchParams (for the "?new=1" add-member dialog) needs a Suspense boundary in Next.js.
  return (
    <Suspense fallback={<Loading />}>
      <Members />
    </Suspense>
  );
}
