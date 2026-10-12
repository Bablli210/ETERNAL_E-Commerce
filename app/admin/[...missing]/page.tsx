import { notFound } from "next/navigation";

/** Any other /admin address: the dashboard's own not-found page, not the shop's. */
export default function Missing() {
  notFound();
}
