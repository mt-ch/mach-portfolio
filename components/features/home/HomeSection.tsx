import { Children, type ReactNode } from "react";

export function HomeSection({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const hasContent = Children.toArray(children).some(
    (child) => !(typeof child === "string" && child.trim().length === 0),
  );

  if (!hasContent) {
    return null;
  }

  return (
    <div className="px-md gap-md relative grid grid-cols-1 lg:grid-cols-12">
      <h2 className="type-body font-medium lg:col-span-5">[{title}]</h2>
      <div className="gap-lg relative flex flex-col w-full lg:col-span-7">{children}</div>
    </div>
  );
}
