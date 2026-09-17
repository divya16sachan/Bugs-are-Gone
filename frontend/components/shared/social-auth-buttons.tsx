"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * Social sign-in. UI only for now — wire onClick to your gateway's OAuth start
 * route once the backend exposes it. Shared between login and register.
 */
export function SocialAuthButtons() {
  const handleGoogle = () => {
    // TODO: point at your OAuth entrypoint when ready, e.g.
    // window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
      <HugeiconsIcon icon={GoogleIcon} size={18} className="mr-2" />
      Continue with Google
    </Button>
  );
}
