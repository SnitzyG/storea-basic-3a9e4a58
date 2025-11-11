import * as React from "react";
import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

// Level 1: Role Filter Tabs (Top-Level - Large, Primary)
export const RoleFilterTabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "grid w-full h-12 bg-background border border-border rounded-lg shadow-md p-1.5 gap-1",
      className
    )}
    {...props}
  />
));
RoleFilterTabsList.displayName = "RoleFilterTabsList";

export const RoleFilterTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, children, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-6 py-3 text-base font-semibold",
      "rounded-md transition-all",
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
      "hover:bg-muted/50",
      className
    )}
    {...props}
  >
    {children}
  </TabsTrigger>
));
RoleFilterTabsTrigger.displayName = "RoleFilterTabsTrigger";

// Level 2: Main Financial Tabs (Medium, Secondary)
export const MainFinancialTabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "grid w-full h-11 items-center rounded-md bg-muted/60 p-1 shadow-sm",
      className
    )}
    {...props}
  />
));
MainFinancialTabsList.displayName = "MainFinancialTabsList";

export const MainFinancialTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, children, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium",
      "rounded-sm transition-all whitespace-nowrap",
      "data-[state=active]:bg-background/80 data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "hover:bg-background/40",
      className
    )}
    {...props}
  >
    {children}
  </TabsTrigger>
));
MainFinancialTabsTrigger.displayName = "MainFinancialTabsTrigger";

// Level 3: Subtabs (Smaller, Tertiary)
export const SubTabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "grid w-full h-10 items-center rounded-sm bg-muted/40 p-1",
      className
    )}
    {...props}
  />
));
SubTabsList.displayName = "SubTabsList";

export const SubTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, children, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-3 py-1.5 text-sm font-normal",
      "rounded-sm transition-all whitespace-nowrap",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "hover:bg-background/60",
      className
    )}
    {...props}
  >
    {children}
  </TabsTrigger>
));
SubTabsTrigger.displayName = "SubTabsTrigger";
