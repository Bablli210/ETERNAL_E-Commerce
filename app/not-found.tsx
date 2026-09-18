import Link from "next/link";
import { Mark } from "@/components/ui/Wordmark";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Mark size={96} className="text-night" />
      <h1 className="display-l mt-8">This page has faded.</h1>
      <p className="body-l mt-3 max-w-[40ch] text-ash">The scents have not. Start again from the collection, or let the finder choose.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/shop" className="btn">
          Shop the collection
        </Link>
        <Link href="/finder" className="btn btn-secondary">
          Find your scent
        </Link>
      </div>
    </section>
  );
}
