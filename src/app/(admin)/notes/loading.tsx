export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-neutral/40 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white p-5 rounded-xl border border-neutral/30 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-neutral/30" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral/30 rounded w-3/4" />
              <div className="h-6 bg-neutral/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral/30 overflow-hidden">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="px-6 py-4 border-b border-neutral/20 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-neutral/30" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-neutral/30 rounded w-40" />
              <div className="h-3 bg-neutral/20 rounded w-28" />
            </div>
            <div className="h-6 w-16 bg-neutral/20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
