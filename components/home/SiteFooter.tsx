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
      <div className="bg-grey-400 h-3xl w-full">
        <div className="w-full h-full bg-background rounded-b-xl"></div>
      </div>
      <div className="p-md gap-xl bg-grey-400 relative flex flex-col h-screen justify-between">
        <h2 className="type-body font-medium text-background pr-2xl">
          <span className="text-transparent">({about.name}) </span>
          {footerTextLines.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}{" "}
          <a href={`mailto:${about.email}`} className="">
            Email me
          </a>
        </h2>

        <div className="flex justify-between">
          <p className="type-body font-medium text-background">©{year}</p>
          <div className="flex gap-md">
            {about.resumeUrl && (
              <a href={about.resumeUrl} className="type-body font-medium text-background" download>
                Resume
              </a>
            )}
            {about.socialLinks?.map((link) => (
              <a key={link._key} href={link.url} target="_blank" rel="noreferrer" className="type-body font-medium text-background">
                {link.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
