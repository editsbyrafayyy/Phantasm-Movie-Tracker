'use client';

import { motion } from 'framer-motion';

export function VaultSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 lg:px-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div 
            className="skeleton aspect-[2/3] rounded-lg overflow-hidden relative"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="skeleton h-4 w-3/4 rounded" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          <div className="skeleton h-3 w-1/2 rounded" style={{ animationDelay: `${i * 100 + 100}ms` }} />
        </div>
      ))}
    </div>
  );
}
