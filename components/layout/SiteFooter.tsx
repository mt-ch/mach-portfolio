import { Fragment } from "react";

import type { About } from "@/lib/sanity";

export function SiteFooter({ about }: { about: About }) {
  const year = new Date().getFullYear();
  const footerTextLines = about.footerText
    ? about.footerText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  return (
    <footer>
      <div className="p-md gap-xl bg-background relative flex h-screen">
        <div className="from-brand to-background absolute bottom-0 left-0 z-0 h-full w-full bg-linear-to-t"></div>
        <div className="relative z-10 flex h-full w-full flex-col justify-between">
          <h2 className="type-body text-foreground pr-32 font-medium">
            <span className="text-transparent">({about.name}) </span>
            {footerTextLines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h2>

          <div className="flex justify-between">
            <p className="type-body font-medium text-white">©{year}</p>
            <div className="gap-lg flex">
              <a
                href={`mailto:${about.email}`}
                className="type-body font-medium text-white"
                data-cursor="label"
                data-cursor-label="Copy Email"
                data-cursor-icon="mail"
              >
                Email
              </a>
              {about.resumeUrl && (
                <a
                  href={about.resumeUrl}
                  className="type-body font-medium text-white"
                  download
                  data-cursor="link"
                >
                  Resume
                </a>
              )}
              {about.socialLinks?.map((link) => (
                <a
                  key={link._key}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="type-body font-medium text-white"
                  data-cursor="link"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
