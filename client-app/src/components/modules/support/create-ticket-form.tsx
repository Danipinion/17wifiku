"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTicket } from "@/actions/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export function CreateTicketForm() {
  const [state, action, isPending] = useActionState(createTicket, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Describe your issue and we will get back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow_internet">Slow Internet</SelectItem>
                <SelectItem value="no_connection">No Connection</SelectItem>
                <SelectItem value="billing">Billing Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.category && (
              <p className="text-sm text-destructive">
                {state.errors.category}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Brief summary of the issue"
              required
            />
            {state?.errors?.subject && (
              <p className="text-sm text-destructive">{state.errors.subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Please provide specific details..."
              className="min-h-[100px]"
              required
            />
            {state?.errors?.message && (
              <p className="text-sm text-destructive">{state.errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-bold"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Submit Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
