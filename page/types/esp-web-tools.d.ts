import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "esp-web-install-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          manifest?: string;
          eraseFirst?: boolean;
          impl?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "esp-web-install-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          manifest?: string;
          eraseFirst?: boolean;
          impl?: string;
        },
        HTMLElement
      >;
    }
  }
}
