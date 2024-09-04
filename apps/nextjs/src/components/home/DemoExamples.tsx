"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@socketless/ui/tooltip"
import Image from "next/image";
import Link from "next/link";

export default function DemoExamples() {
  return <div className="flex flex-row gap-4 justify-center items-center pt-4">
    <Link href="https://github.com/wosherco/socketless-nextjs-demo" target="_blank">
      <Image src="/logos/nextjs.svg" width={35} height={35} alt="nextjs" />
    </Link>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Image src="/logos/solidjs.svg" width={35} height={35} alt="solidjs" className="opacity-60" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Coming soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
}