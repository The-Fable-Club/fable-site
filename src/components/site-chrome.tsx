import type { ReactNode } from "react";
import { Rail } from "@/components/rail";
import { Footer } from "@/components/footer";
import { DevContentRefresh } from "@/components/dev-content-refresh";
import { getContent } from "@/lib/content";

// Rail + footer around the public pages. Used by the (site) route group;
// the CMS admin lives outside it and is shown bare.
export async function SiteChrome({ children }: { children: ReactNode }) {
  const { club } = await getContent();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-20 focus:top-3 focus:z-[100] focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      {process.env.NODE_ENV === "development" && <DevContentRefresh />}
      <Rail name={club.name} />
      <div className="with-rail">
        <main id="main">{children}</main>
        <Footer club={club} />
      </div>
    </>
  );
}
