import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

interface CompanyAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  companyLogoUrl?: string;
  avatarUrl?: string;
  fallback: string;
  className?: string;
}

const CompanyAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  CompanyAvatarProps
>(({ className, companyLogoUrl, avatarUrl, fallback, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  >
    {/* Company logo background (transparent) */}
    {companyLogoUrl && (
      <div 
        className="absolute inset-0 rounded-full bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${companyLogoUrl})` }}
      />
    )}
    
    {/* User avatar */}
    <AvatarPrimitive.Image
      src={avatarUrl}
      className="aspect-square h-full w-full relative z-10"
    />
    
    {/* Fallback with initials */}
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted relative z-10",
        companyLogoUrl && "bg-muted/80"
      )}
    >
      {fallback}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
))
CompanyAvatar.displayName = "CompanyAvatar"

export { CompanyAvatar }