import type { About } from "@/lib/sanity";

export function SiteFooter({ about }: { about: About }) {
  const year = new Date().getFullYear();

  return (
    <div className="p-md gap-xl bg-grey-400 relative flex flex-col h-screen justify-between">
      <h2 className="type-body font-medium text-white">
        <span className="text-transparent">{about.name} </span>
        {about.availabilityStatus ? (
          <>
            {" is "}
            <span className="text-accent">{about.availabilityStatus}</span>
            {about.footerMessage ? ` ${about.footerMessage}` : null}
          </>
        ) : (
          about.footerMessage
        )}
        <br />
        <a href={`mailto:${about.email}`} className="underline">
          Email me
        </a>
      </h2>

      <div className="flex justify-between">
        <p className="type-body font-medium text-white">©{year}</p>
        <div className="flex gap-md">
          {about.resumeUrl && (
            <a href={about.resumeUrl} className="type-body font-medium text-white" download>
              Resume
            </a>
          )}
          {about.socialLinks?.map((link) => (
            <a key={link._key} href={link.url} target="_blank" rel="noreferrer" className="type-body font-medium text-white">
              {link.platform}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
