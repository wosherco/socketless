"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";
import { Checkbox } from "@socketless/ui/checkbox";

export default function SignIn() {
  const [canContinue, setCanContinue] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in to Socketless</CardTitle>
        <CardDescription>Sign in with the following methods:</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant={"outline"}
          disabled={!canContinue || loading}
          className="w-full justify-center transition-opacity"
          onClick={() => {
            setLoading(true);
            router.push("/auth/github");
          }}
        >
          {loading && <LoaderCircle className="animate-spin" />}Login with
          Github
        </Button>
      </CardContent>
      <CardFooter>
        <div className="items-top flex space-x-2">
          <Checkbox
            id="terms1"
            onCheckedChange={(v) =>
              setCanContinue(v === "indeterminate" ? false : v)
            }
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accept terms and conditions
              <span className="text-[#ff0000]">*</span>
            </label>
            <p className="text-sm text-muted-foreground">
              You agree to our{" "}
              <Link href="/terms-of-service">Terms of Service</Link>.
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
