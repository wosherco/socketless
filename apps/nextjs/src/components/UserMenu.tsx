"use client";

import Link from "next/link";

import type { User } from "@socketless/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@socketless/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@socketless/ui/dropdown-menu";

import { logoutAction } from "~/actions/Logout";

export default function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.profilePicture} />
          <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/" className="h-full w-full">
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <form action={logoutAction} className="w-full">
            <button className="w-full text-start">Log out</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
