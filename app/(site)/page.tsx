import { getAbout, getFeaturedProjects } from "@/lib/sanity";
import { FeaturedProjectRow } from "@/components/features/home/FeaturedProjectRow";
import { HeroSection } from "@/components/features/home/HeroSection";
import { WhatIDoSection } from "@/components/features/home/WhatIDoSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNav } from "@/components/layout/SiteNav";
import { ArrowUpRightIcon } from "lucide-react";

export default async function Home() {
  const [about, projects] = await Promise.all([
    getAbout(),
    getFeaturedProjects(),
  ]);

  if (!about) {
    return (
      <main className="p-md relative">
        <p className="type-body text-black">
          About content is not configured yet.
        </p>
      </main>
    );
  }

  return (
    <main className="text-foreground relative">
      <div className="bg-background">
        <SiteNav about={about} />
        <HeroSection about={about} />
        {projects.length > 0 && (
          <div className="gap-xl lg:px-md relative flex flex-col">
            {projects.map((project) => (
              <FeaturedProjectRow key={project._id} project={project} />
            ))}
          </div>
        )}
        <div className="relative flex flex-col py-3xl my-3xl">
          <WhatIDoSection about={about} />
          <div className="px-md gap-md relative grid grid-cols-1 sm:grid-cols-2 mb-3xl pb-3xl">
            <h2 className="type-body font-medium">[How I work]</h2>
            <div className="gap-lg relative flex flex-col">
              <div className="gap-xs relative flex flex-col">
                <p className="type-body">
                  I slot into existing teams quickly. I communicate in Slack,
                  deliver in Figma, and stay close to the work without needing
                  layers of coordination. <br />
                  <br /> I am comfortable with ambiguous briefs, shifting
                  priorities, and tight deadlines. Available for project work,
                  retainers, and short embedded support. Remote or on-site in
                  Brussels and Oslo.
                </p>
              </div>
            </div>
          </div>
          <div className="px-md gap-md relative grid grid-cols-1 sm:grid-cols-2">
            <h2 className="type-body font-medium">[Experience]</h2>
            <table>
              <thead className="border-grey-200 dark:border-grey-800 border-b">
                <tr>
                  <th className="type-body text-grey-500 dark:text-grey-400 pb-sm text-left font-normal">
                    Company
                  </th>
                  <th className="type-body text-grey-500 dark:text-grey-400 pb-sm text-left font-normal">
                    Role
                  </th>
                  <th className="type-body text-grey-500 dark:text-grey-400 pb-sm text-left font-normal">
                    Period
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-grey-200 dark:border-grey-800 border-b">
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    Virtue Health Group
                  </td>
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    Frontend Engineer
                  </td>
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    2024 -
                  </td>
                  <th>
                    <a
                      href="https://www.pertemps.com/"
                      className="bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 inline-flex size-10 cursor-pointer items-center justify-center"
                      data-cursor="button"
                    >
                      <ArrowUpRightIcon className="size-md" />
                    </a>
                  </th>
                </tr>

                <tr>
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    Pertemps
                  </td>
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    Software Engineer
                  </td>
                  <td className="type-body pb-sm pt-lg pb-sm text-left font-normal">
                    2022 - 2024
                  </td>
                  <th>
                    <a
                      href="https://www.pertemps.com/"
                      className="bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 inline-flex size-10 cursor-pointer items-center justify-center"
                      data-cursor="button"
                    >
                      <ArrowUpRightIcon className="size-md" />
                    </a>
                  </th>
                </tr>
                <tr className="border-grey-200 dark:border-grey-800 border-b">
                  <td className="type-body py-sm text-left font-normal"></td>
                  <td className="type-body py-sm border-grey-200 dark:border-grey-800 border-t text-left font-normal">
                    Junior Software Engineer
                  </td>
                  <td className="type-body py-sm border-grey-200 dark:border-grey-800 border-t text-left font-normal">
                    2021 - 2022
                  </td>
                  <td className="py-sm border-grey-200 dark:border-grey-800 border-t"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
