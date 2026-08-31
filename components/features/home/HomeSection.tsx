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
    <div className="px-md gap-md relative flex flex-col lg:flex-row">
      <h2 className="type-body font-medium">[{title}]</h2>
      <div className="gap-lg relative flex flex-col">{children}</div>
    </div>
  );
}
