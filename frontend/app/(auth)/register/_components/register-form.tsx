"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, UserIcon, Store01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { PasswordInput } from "@/components/shared/password-input";
import { SocialAuthButtons } from "@/components/shared/social-auth-buttons";
import { cn } from "@/lib/utils";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";

// Only customer/seller are self-selectable — admin is assigned, never signed up.
const accountTypes = [
  { value: "customer", label: "Shop", icon: UserIcon },
  { value: "seller", label: "Sell", icon: Store01Icon },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "customer",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: RegisterInput) {
    register.mutate(values, {
      onSuccess: () => {
        toast.success("Account created — welcome!");
        router.push("/");
        router.refresh();
      },
      onError: (err) => toast.error(err.message || "Could not create account"),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>I want to</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  {accountTypes.map((t) => (
                    <div key={t.value}>
                      <RadioGroupItem
                        value={t.value}
                        id={`role-${t.value}`}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`role-${t.value}`}
                        className={cn(
                          "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background py-3 text-sm",
                          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary"
                        )}
                      >
                        <HugeiconsIcon icon={t.icon} size={18} />
                        {t.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending && (
            <HugeiconsIcon
              icon={Loading03Icon}
              size={18}
              className="mr-2 animate-spin"
            />
          )}
          Create account
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <SocialAuthButtons />

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </Form>
  );
}
