"use client";

import { ReactElement, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TooltipWrapper = ({
  message = "",
  delay = 0,
  children,
}: {
  message?: string;
  delay?: number;
  children: ReactNode;
}) => {
  if (!message) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger delay={delay} render={children as ReactElement} />
      <TooltipContent>
        <p>{message}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipWrapper;