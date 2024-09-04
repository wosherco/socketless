"use client";

import { cn } from "@socketless/ui";
import { CodeBlock, atomOneDark } from "react-code-blocks";
import { Monaco } from "~/app/fonts";


const serverCode = `import { createSocketless } from "socketless.ws/server";

export const socketless = createSocketless({
  onMessage: (context, identifier, message) => 
    context.send(
    \`\${identifier}: "\${message}"\`, 
    { 
      rooms: ["demo"] 
    }
  ),
})`

const clientCode = `import { socketless } from "@/server/socketless";

const url = await socketless.getConnection(name, ["demo"]);
const ws = new WebSocket(url);`

export default function Features() {


  return (
    <div className={cn(Monaco.className, "gap-4 flex flex-col px-4 lg:grid grid-rows-1 grid-cols-2")}>
      <div className="bg-[#32343e] rounded-lg overflow-hidden h-fit">
        <p className="text-center text-white py-0.5">socketless.ts</p>
        <CodeBlock
          text={serverCode}
          language={"typescript"}
          showLineNumbers={false}
          theme={atomOneDark}
          wrapLongLines={true}
        />
      </div>
      <div className="bg-[#32343e] rounded-lg overflow-hidden h-fit">
        <p className="text-center text-white py-0.5">page.tsx</p>
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

