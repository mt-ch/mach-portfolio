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
      <div className="bg-foreground h-3xl w-full">
        <div className="w-full h-full bg-background rounded-b-lg"></div>
      </div>
      <div className="p-md gap-xl bg-foreground relative flex flex-col h-screen justify-between">
        <h2 className="type-body font-medium text-background pr-2xl">
          <span className="text-transparent">({about.name}) </span>
          {footerTextLines.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}
          <br />
          <a
            href={`mailto:${about.email}`}
            className=""
            data-cursor="label"
            data-cursor-label="Copy Email"
            data-cursor-icon="mail"
          >
            Email me
          </a>
        </h2>

        <div className="flex justify-between">
          <p className="type-body font-medium text-background">©{year}</p>
          <div className="flex gap-md">
            {about.resumeUrl && (
              <a href={about.resumeUrl} className="type-body font-medium text-background" download data-cursor="link">
                Resume
              </a>
            )}
            {about.socialLinks?.map((link) => (
              <a
                key={link._key}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="type-body font-medium text-background"
                data-cursor="link"
              >
                {link.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
