import { getAbout, getExperience, getProjects } from "@/lib/sanity";
import { ExperienceList } from "@/components/ExperienceList";
import { ReframeHome } from "@/components/reframe/ReframeHome";

export default async function Home() {
  const [about, experience, projects] = await Promise.all([getAbout(), getExperience(), getProjects()]);

  return (
    // <main className="relative mx-auto max-w-3xl space-y-16 px-6 py-16">
    //   {about && <ReframeHome about={about} projects={projects} />}
    //   <ExperienceList entries={experience} />
    // </main>
    <main className="relative">
      {/* Nav */}
      <div className="fixed top-md left-md z-10 mix-blend-difference">
        <a href="#" className="type-body font-medium text-white">
          Matthew Chan
        </a>
      </div>
      {/* Hero */}
      <div className="p-md gap-xl bg-brand relative flex flex-col h-124">
        <h1 className="type-body font-medium text-accent">
          <span className="text-transparent">Matthew Chan</span> is a product designer based in San Diego. <br /> Specialising in UX/UI design and
          digital branding since 2013. <br /> <br /> Available for collaborations and full time roles.
        </h1>

        <div className="size-sm">
          <svg className="text-accent" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none">
            <path
              d="M 128.945 0 C 199.203 0.508 256 57.617 256 127.994 C 256 198.686 198.692 255.994 128 255.994 C 57.308 255.994 0 198.686 0 127.994 C 0 57.617 56.797 0.509 127.054 0 C 87.725 0.506 56 32.544 56 71.994 C 56 111.759 88.236 143.994 128 143.994 C 167.764 143.994 200 111.759 200 71.994 C 200 32.545 168.274 0.506 128.945 0 Z M 128 47.994 C 141.255 47.994 152 58.739 152 71.994 C 152 85.249 141.255 95.994 128 95.994 C 114.745 95.994 104 85.249 104 71.994 C 104 58.739 114.745 47.994 128 47.994 Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>
      {/* Projects */}
      <div className="p-md gap-md relative flex flex-col">
        {/* Project */}
        <div className="inline-flex flex-col gap-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm aspect-3/2 h-124">
            <div className="w-full bg-grey-100"></div>
            <div className="w-full bg-grey-100 col-span-2 hidden md:block"></div>
          </div>
          <h2 className="type-body font-medium text-black">
            The Home Hospital: <span className="text-grey-200">Treatment that transcends limits</span>
          </h2>
        </div>
        {/* Project */}
        <div className="inline-flex flex-col gap-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm aspect-3/2 h-124">
            <div className="w-full bg-grey-100 col-span-2 hidden md:block"></div>
            <div className="w-full bg-grey-100"></div>
          </div>
          <h2 className="type-body font-medium text-black">
            Mother Goods: <span className="text-grey-200">Commerce that connects with culture</span>
          </h2>
        </div>
        {/* Project */}
        <div className="inline-flex flex-col gap-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm aspect-3/2 h-124">
            <div className="w-full bg-grey-100"></div>
            <div className="w-full bg-grey-100 col-span-2 hidden md:block"></div>
          </div>
          <h2 className="type-body font-medium text-black">
            Pertemps: <span className="text-grey-200">From salary doubt to career direction</span>
          </h2>
        </div>
        {/* Project */}
        <div className="inline-flex flex-col gap-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm aspect-3/2 h-124">
            <div className="w-full bg-grey-100 col-span-2 hidden md:block"></div>
            <div className="w-full bg-grey-100"></div>
          </div>
          <h2 className="type-body font-medium text-black">
            ISE Partners: <span className="text-grey-200">A fresh face for a forwards company</span>
          </h2>
        </div>
      </div>

      {/* Footer */}
      <div className="p-md gap-xl bg-grey-400 relative flex flex-col h-screen justify-between">
        <h2 className="type-body font-medium text-white">
          <span className="text-transparent">Matthew Chan</span> is <span className="text-accent">available</span> for collaborations and full time
          roles.
          <br />
          <span>Email me</span>
        </h2>

        <div className="flex justify-between">
          <p className="type-body font-medium text-white">©2026</p>
          <div className="flex gap-md">
            <a href="#" className="type-body font-medium text-white">
              Resume
            </a>
            <a href="#" className="type-body font-medium text-white">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
