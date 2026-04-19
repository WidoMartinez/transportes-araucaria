import * as React from "react"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = es,
  ...props
}) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-4",
        month_caption: "relative flex h-8 items-center justify-center px-8 pt-1",
        caption_label: "text-sm font-medium capitalize",
        nav: "absolute inset-x-0 top-1 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-60 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-60 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 text-muted-foreground rounded-md font-normal text-[0.8rem] text-center",
        week: "mt-2 flex w-full",
        day: cn(
          "relative flex h-8 w-8 items-center justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range" && "[&:has([aria-selected].rdp-day_button)]:bg-accent/50"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today:
          "[&>button]:border [&>button]:border-accent [&>button]:bg-accent/10 [&>button]:text-accent-foreground",
        outside:
          "text-muted-foreground opacity-60 [&>button]:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50 [&>button]:cursor-not-allowed",
        range_start:
          "[&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle:
          "[&>button]:bg-accent/15 [&>button]:text-foreground",
        range_end:
          "[&>button]:bg-primary [&>button]:text-primary-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => (
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...props} />
          )
        ),
      }}
      {...props} />
  );
}

export { Calendar }
