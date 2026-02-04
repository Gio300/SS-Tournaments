import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-text-muted mb-6">Page not found.</p>
      <Link href="/" className="text-accent hover:underline font-medium">
        Back to Home
      </Link>
    </div>
  );
}
