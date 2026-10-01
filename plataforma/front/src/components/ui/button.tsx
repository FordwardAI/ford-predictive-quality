import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Botones de Ford Brand Central (§5): CTA Skyview con texto blanco, outline de 3 px (grande) o 2 px (compacto)
// en forma de píldora. Sin sombras. Hover dentro de la paleta: el CTA pasa a Ford Blue y los outline a gris claro.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-ford-blue",
        outline: "border-3 border-ford-skyview bg-white text-black hover:bg-ford-gray",
        compact: "border-2 border-ford-skyview bg-white text-ford-blue hover:bg-ford-gray",
        secondary: "bg-ford-gray text-ford-blue hover:bg-ford-blue hover:text-white",
        ghost: "text-ford-blue hover:bg-ford-gray",
        inverse: "bg-white text-ford-blue hover:bg-ford-gray",
        link: "text-ford-skyview underline-offset-4 hover:underline",
        destructive: "bg-ford-blue text-white hover:bg-ford-twilight",
      },
      size: {
        cta: "h-[76px] rounded-lg px-6 text-lg",
        default: "h-12 rounded-full px-6",
        sm: "h-8 rounded-full px-4",
        icon: "size-12 rounded-full",
        "icon-sm": "size-8 rounded-full",
        // Alias que usan otros componentes de shadcn.
        xs: "h-8 rounded-full px-3",
        lg: "h-12 rounded-full px-6",
        "icon-xs": "size-8 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
