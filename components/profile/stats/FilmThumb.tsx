import Image from 'next/image';
import { Film } from 'lucide-react';
import { gridPosterUrl } from '@/components/vault/posterSrc';

/** Small poster used across the profile stat cards. */
export default function FilmThumb({ src, className = 'pstat-thumb' }: { src: string | null; className?: string }) {
  const url = gridPosterUrl(src);
  return (
    <span className={className} aria-hidden="true">
      {url ? <Image src={url} alt="" fill sizes="120px" /> : <Film size={16} />}
    </span>
  );
}
