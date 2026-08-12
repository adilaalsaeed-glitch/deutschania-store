import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { LegalContent } from "@/content/legal/types";

export function LegalPage({ content, homeLabel }: { content: LegalContent; homeLabel: string }) {
  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="cart-page-inner legal-page">
          <nav className="pp-breadcrumb">
            <Link href="/">{homeLabel}</Link>
          </nav>
          <h1 className="auth-title">{content.title}</h1>
          {content.intro && <p className="auth-sub">{content.intro}</p>}
          {content.sections.map((section, i) => (
            <div className="legal-section" key={i}>
              <h2>{section.heading}</h2>
              {section.body?.map((p, j) => <p key={j}>{p}</p>)}
              {section.fields && (
                <dl className="legal-fields">
                  {section.fields.map((f, j) => (
                    <div className="legal-field-row" key={j}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}
