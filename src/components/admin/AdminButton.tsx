"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface AdminButtonBaseProps {
  variant?: Variant;
  children?: ReactNode;
  className?: string;
}

interface AdminButtonLinkProps extends AdminButtonBaseProps {
  href: string;
}

interface AdminButtonButtonProps extends AdminButtonBaseProps, ButtonHTMLAttributes<HTMLButtonElement> {}

export type AdminButtonProps = AdminButtonLinkProps | AdminButtonButtonProps;

export function AdminButton(props: AdminButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-label-md font-bold transition-colors";
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container",
    secondary: "bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container",
    danger: "bg-error text-on-error hover:bg-error-container hover:text-on-error-container",
    ghost: "text-on-surface-variant hover:text-primary hover:bg-surface-container",
  };

  const variant = props.variant || "primary";
  const className = `${base} ${variants[variant]} ${props.className || ""}`;

  if ("href" in props) {
    const { href, ...rest } = props as AdminButtonLinkProps;
    return <Link href={href} className={className} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>{rest.children}</Link>;
  }

  return <button className={className} {...(props as AdminButtonButtonProps)}>{props.children}</button>;
}
