import { ArrowDown, Check } from "lucide-react";

function Cross({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
      className={className}
    >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  );
}

export default function ProsCons() {
  return (
    <section id="pros-cons">
      <h3 className="text-center text-4xl font-bold">
        What does it take to create a Realtime Experience?
      </h3>
      <h4 className="mx-auto max-w-[700px] p-4 text-center text-lg">
        Let's say you want to build a Realtime Experience in a traditional way,
        here's what you're going to encounter:
      </h4>

      <div className="my-8 flex flex-col items-center gap-8 md:grid md:grid-cols-2 md:grid-rows-1 md:items-start md:gap-20">
        <div className="rounded-lg border-2 border-secondary-foreground bg-[#00bd10] p-4 text-white md:ml-auto">
          <p className="text-xl font-medium">Pros</p>
          <hr className="my-2 rounded-lg border-2 border-white" />
          <ul className="ml-2 mt-4 flex flex-col gap-4">
            <li className="inline-flex">
              <Check className="mr-2" />
              <p>
                Provide <b>Realtime Data</b> to Frontend
              </p>
            </li>
            <li className="flex flex-row">
              <Check className="mr-2" />
              <p>
                Better <b>User Experience</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Check className="mr-2" />
              <p>
                Capture many <b>more users</b>
              </p>
            </li>
          </ul>
        </div>
        <div className="rounded-lg border-2 border-secondary-foreground bg-[#df0000] p-4 text-white md:mr-auto">
          <p className="text-xl font-medium">Cons</p>
          <hr className="my-2 rounded-lg border-2 border-white" />
          <ul className="ml-2 mt-4 flex flex-col gap-4">
            <li className="inline-flex">
              <Cross className="mr-2" />
              <p>
                Handle <b>persistent client connections</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Cross className="mr-2" />
              <p>
                Maintain <b>complex infrastructure</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Cross className="mr-2" />
              <p>
                Hard to <b>scale</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Cross className="mr-2" />
              <p>
                High <b>latency</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Cross className="mr-2" />
              <p>
                High <b>bandwidth</b>
              </p>
            </li>
            <li className="flex flex-row">
              <Cross className="mr-2" />
              <p>And more...</p>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-6 inline-flex w-full items-center justify-center text-xl underline">
        <ArrowDown className="mr-2" />
        There's an easier way
      </p>
    </section>
  );
}
