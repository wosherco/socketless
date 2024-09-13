"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Input } from "@socketless/ui/input";

export default function HidableInput({ value }: { value: string }) {
  const [hidden, setHidden] = useState(true);

  return (
    <div className="flex flex-grow flex-row items-center">
      <button onClick={() => setHidden((prev) => !prev)} className="p-2">
        {hidden ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      <Input
        type={hidden ? "password" : "text"}
        value={value}
        readOnly
        className="w-full flex-grow"
      />
    </div>
  );
}
