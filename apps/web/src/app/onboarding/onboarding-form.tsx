"use client";

import { useActionState } from "react";
import { submitOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnboardingForm() {
  const [state, formAction] = useActionState(
    async (_prev: null | { error?: string }, formData: FormData) =>
      submitOnboarding(formData),
    null
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Complete your profile</CardTitle>
        <CardDescription>
          Tell us a bit about yourself. You can change these later in account settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <Input
            name="display_name"
            placeholder="Name"
            required
            autoComplete="name"
          />
          <Input
            name="company_name"
            placeholder="Brand / company name"
            autoComplete="organization"
          />
          <Input
            name="website"
            type="text"
            placeholder="e.g. yoursite.com"
            autoComplete="url"
          />
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Continue to app
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
