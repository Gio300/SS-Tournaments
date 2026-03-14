import { LiveStreamsClient } from './LiveStreamsClient';
import { OBSControl } from '@/components/OBSControl';

export default function LivePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Live Streams
      </h1>
      <p className="text-text-muted mb-8">
        Watch and share live streams from the community. Add YouTube links to stream.
      </p>
      <LiveStreamsClient />
      <div className="mt-12">
        <OBSControl />
      </div>
    </div>
  );
}
