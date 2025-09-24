import { use } from 'react';
import StreamView from '../../components/StreamView';

export default function Page({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = use(params);
  return <StreamView creatorId={creatorId} share={true} />;
}
