import { permanentRedirect } from 'next/navigation';

// Browse and Stream were the same page — /stream is the single discovery page now.
export default function BrowsePage(): never {
  permanentRedirect('/stream');
}
