"use client";

import { atomOneDark, CodeBlock } from "react-code-blocks";

import { cn } from "@socketless/ui";

import { Monaco } from "~/app/fonts";

const serverCode = `import { createSocketless } from "socketless.ws/server";

export const socketless = createSocketless({
  onMessage: (context, identifier, message) => 
    context.send(\`\${identifier}: \${message}\`),
})`;

const clientCode = `import { socketless } from "@/server/socketless";

const url = await socketless.getConnection(name, ["demo"]);
const ws = new WebSocket(url);`;

export default function Features() {
  return (
    <div
      className={cn(
        Monaco.className,
        "flex grid-cols-2 grid-rows-1 flex-col gap-4 px-4 lg:grid",
      )}
    >
      <div className="h-fit overflow-hidden rounded-lg bg-[#32343e]">
        <p className="py-0.5 text-center text-white">socketless.ts</p>
        <CodeBlock
          text={serverCode}
          language={"typescript"}
          showLineNumbers={false}
          theme={atomOneDark}
          wrapLongLines={true}
        />
      </div>
      <div className="h-fit overflow-hidden rounded-lg bg-[#32343e]">
        <p className="py-0.5 text-center text-white">page.tsx</p>
        <CodeBlock
          text={clientCode}
          language={"typescript"}
          showLineNumbers={false}
          theme={atomOneDark}
          wrapLongLines={true}
        />
      </div>
    </div>
  );
}
