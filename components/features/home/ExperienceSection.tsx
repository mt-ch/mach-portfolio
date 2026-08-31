import { ArrowUpRightIcon } from "lucide-react";

import type { ExperienceEntry, ExperienceRole } from "@/lib/sanity";
import { HomeSection } from "@/components/features/home/HomeSection";

function formatPeriod(role: ExperienceRole): string {
  const start = role.startDate.slice(0, 4);
  const end = role.isCurrent ? "Present" : (role.endDate ?? "").slice(0, 4);
  return `${start} – ${end}`;
}

export function ExperienceSection({ entries }: { entries: ExperienceEntry[] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <HomeSection title="Experience">
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
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) =>
            entry.roles.map((role, roleIndex) => (
              <tr
                key={role._key}
                className="border-grey-200 dark:border-grey-800 border-b"
              >
                <td className="type-body py-sm text-left font-normal">
                  {roleIndex === 0 ? entry.company : ""}
                </td>
                <td className="type-body py-sm text-left font-normal">
                  {role.title}
                </td>
                <td className="type-body py-sm text-left font-normal">
                  {formatPeriod(role)}
                </td>
                <td className="py-sm">
                  {roleIndex === 0 && entry.companyUrl ? (
                    <a
                      href={entry.companyUrl}
                      className="bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 inline-flex size-10 cursor-pointer items-center justify-center"
                      data-cursor="button"
                    >
                      <ArrowUpRightIcon className="size-md" />
                    </a>
                  ) : null}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </HomeSection>
  );
}
