"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { useOutsideClick } from "~~/hooks/helper";

/**
 * Site header
 */
export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar min-h-0 shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start pl-4">
        <Link className="flex items-center gap-3" href="/lend">
          <Image
            alt="BlindLend logo"
            className="h-9 w-9 rounded-full border border-amber-300"
            height={36}
            src="/blindlend-logo.svg"
            width={36}
          />
          <span className="text-sm font-extrabold tracking-wide text-slate-900">BlindLend</span>
        </Link>
      </div>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
