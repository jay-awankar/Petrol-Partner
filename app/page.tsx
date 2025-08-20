export default function Home() {
  return (
    <section className="grid gap-6 md:grid-cols-2 items-center">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Share rides within your college community
        </h1>
        <p className="text-neutral-600">
          Verified students only. Offer empty seats or find a ride quickly — save money and the planet.
        </p>
        <div className="flex gap-3">
          <a href="/rides" className="rounded-lg px-4 py-2 border text-sm">Find Rides</a>
          <a href="/rides/new" className="rounded-lg px-4 py-2 bg-black text-white text-sm">Offer a Ride</a>
        </div>
      </div>
      <div className="rounded-2xl bg-white border p-6">
        <p className="text-sm text-neutral-500">Live campus rides</p>
        <p className="text-neutral-800 font-medium mt-2">Open the Rides page to view realtime offers.</p>
      </div>
    </section>
  );
}
