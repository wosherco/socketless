"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@socketless/ui/tooltip";

export default function DemoExamples() {
  return (
    <div className="flex flex-row items-center justify-center gap-4 pt-4">
      {/* NextJS */}
      <Link
        href="https://github.com/wosherco/socketless-nextjs-demo"
        target="_blank"
      >
        <Image src="/logos/nextjs.svg" width={35} height={35} alt="nextjs" />
      </Link>

      {/* SolidJS */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Image
              src="/logos/solidjs.svg"
              width={35}
              height={35}
              alt="solidjs"
              className="opacity-60"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>

        {/* SvelteKit */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Image
                src="/logos/svelte.svg"
                width={35}
                height={35}
                alt="svelte"
                className="opacity-60"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TooltipProvider>
    </div>
  );
}
