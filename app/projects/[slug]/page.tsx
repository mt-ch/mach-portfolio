import { PortableText } from "@portabletext/react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getProject, getProjects } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity/image";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug.current }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {};
  }

  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
        {project.summary}
      </p>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {project.role && (
          <div>
            <dt className="font-semibold">Role</dt>
            <dd>{project.role}</dd>
          </div>
        )}
        {project.techStack && project.techStack.length > 0 && (
          <div>
            <dt className="font-semibold">Tech stack</dt>
            <dd>{project.techStack.join(", ")}</dd>
          </div>
        )}
      </dl>

      {project.links && project.links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-4">
          {project.links.map((link) => (
            <li key={link._key}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      {project.story && project.story.length > 0 && (
        <div className="prose mt-10 dark:prose-invert">
          {project.story.map((block) =>
            block._type === "textBlock" ? (
              <PortableText key={block._key} value={block.content} />
            ) : (
              <figure key={block._key}>
                {block.image?.asset && (
                  <Image
                    src={urlFor(block.image).width(1200).url()}
                    alt={block.image.alt}
                    width={1200}
                    height={800}
                  />
                )}
                {block.secondImage?.asset && (
                  <Image
                    src={urlFor(block.secondImage).width(1200).url()}
                    alt={block.secondImage.alt}
                    width={1200}
                    height={800}
                  />
                )}
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            ),
          )}
        </div>
      )}
    </main>
  );
}
