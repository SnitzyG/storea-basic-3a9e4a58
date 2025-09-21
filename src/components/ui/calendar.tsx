import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-background rounded-lg shadow-sm border", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button_previous: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 w-8 bg-background p-0 hover:bg-accent hover:text-accent-foreground absolute left-1 top-0"
        ),
        nav_button_next: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 w-8 bg-background p-0 hover:bg-accent hover:text-accent-foreground absolute right-1 top-0"
        ),
        table: "w-full border-collapse table-auto",
        head_row: "grid grid-cols-7 w-full mb-2",
        head_cell: "text-muted-foreground rounded-md font-medium text-xs uppercase tracking-wide text-center py-2 bg-muted/30",
        row: "grid grid-cols-7 w-full",
        cell: cn(
          "relative p-0 text-center text-sm",
          "h-10 sm:h-12",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day_range_end)]:rounded-r-md",
          "[&:has([aria-selected].day_outside)]:bg-accent/50",
          "[&:has([aria-selected])]:bg-accent",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "inline-flex items-center justify-center rounded-md w-full h-full p-0 text-sm font-normal",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-selected:opacity-100 transition-colors"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "font-semibold"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-semibold",
          "before:absolute before:inset-0 before:rounded-md before:border-2 before:border-primary/40"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/40 opacity-50",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30"
        ),
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" {...iconProps} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
