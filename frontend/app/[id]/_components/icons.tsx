import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon as ArrowLeftIcon,
  ArrowRight01Icon as ArrowRightIcon,
  FavouriteIcon as HeartIcon,
  MinusSignIcon as MinusIcon,
  PlusSignIcon as PlusIcon,
  ShoppingCart01Icon as CartIcon,
  StarIcon as StarIconSource,
  ArrowDown01Icon as ChevronDownIcon,
  ArrowUp01Icon as ChevronUpIcon,
} from "@hugeicons/core-free-icons";

interface IconProps {
  size?: number;
  className?: string;
}

export function ArrowLeft01Icon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={ArrowLeftIcon} size={size} className={className} />;
}

export function ArrowRight01Icon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={ArrowRightIcon} size={size} className={className} />;
}

export function FavouriteIcon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={HeartIcon} size={size} className={className} />;
}

export function MinusSignIcon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={MinusIcon} size={size} className={className} />;
}

export function PlusSignIcon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={PlusIcon} size={size} className={className} />;
}

export function ShoppingCart01Icon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={CartIcon} size={size} className={className} />;
}

export function StarIcon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={StarIconSource} size={size} className={className} />;
}

export function ArrowDown01Icon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={ChevronDownIcon} size={size} className={className} />;
}

export function ArrowUp01Icon({ size = 20, className }: IconProps) {
  return <HugeiconsIcon icon={ChevronUpIcon} size={size} className={className} />;
}
