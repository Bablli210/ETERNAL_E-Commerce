import Link from "next/link";
import type { Viewer } from "@/lib/dashboard/types";
import { TopBar } from "./TopBar";

/**
 * The frame for signed-in pages other than the figures (People, Your
 * account): the dashboard's top bar without the period switch, a way back
 * to the figures, the page's title, then its sections. The viewer is part of
 * the contract with those pages; the toolbar the page passes shows who is
 * signed in.
 */
export function PageFrame({
  title,
  toolbar,
  back = false,
  children,
}: {
  title: string;
  viewer: Viewer;
  toolbar?: React.ReactNode;
  back?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar toolbar={toolbar} />
      <main className="dash-main dash-page" id="dash-main">
        {back ? (
          <Link className="dash-back" href="/dashboard" prefetch={false}>
            <span aria-hidden="true">←</span> Back to the figures
          </Link>
        ) : null}
        <h1>{title}</h1>
        {children}
      </main>
    </>
  );
}
