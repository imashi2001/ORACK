import { cva, type VariantProps } from "class-variance-authority";

/** Shared class names for the storefront's square, uppercase call-to-action buttons and links. */
export const cta = cva(
  "group/cta inline-flex min-h-13 items-center justify-center gap-3 border-[1.5px] px-6 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:transition-transform hover:[&_svg.arrow]:translate-x-1",
  {
    variants: {
      tone: {
        light: "border-white bg-white text-ink hover:border-[#d6d6d4] hover:bg-[#d6d6d4]",
        "outline-light": "border-white/75 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink",
        dark: "border-ink bg-ink text-white hover:border-[#2c2c2c] hover:bg-[#2c2c2c]",
        "outline-dark": "border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { tone: "dark" },
  },
);

export type CtaVariants = VariantProps<typeof cta>;
