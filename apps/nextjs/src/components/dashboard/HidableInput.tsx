"use client";

import { Input } from "@socketless/ui/input";
import { EyeIcon, EyeOff, EyeOffIcon } from "lucide-react";
import { useState } from "react";

export default function HidableInput({ value }: { value: string }) {
  const [hidden, setHidden] = useState(true);

  return (
    <div className="flex flex-row items-center flex-grow">
      <button
        onClick={() => setHidden((prev) => !prev)}
        className="p-2"
      >
        {hidden ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      <Input
        type={hidden ? "password" : "text"}
        value={value}
        readOnly
        className="w-full flex-grow"
      />

    </div>
  )
}