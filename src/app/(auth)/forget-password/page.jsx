"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ForgetPassword = () => {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResetPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      toast.error("Please enter your email address.");
      setLoading(false);
      return;
    }

    resetPassword(email)
      .then(() => {
        toast.success("Password reset email sent. Please check your inbox.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      })
      .catch((err) => {
        let errorMessage = "Failed to send password reset email.";

        if (err.code === "auth/user-not-found") {
          errorMessage = "No account found with this email.";
        } else if (err.code === "auth/invalid-email") {
          errorMessage = "Invalid email address.";
        } else if (err.code === "auth/too-many-requests") {
          errorMessage = "Too many requests. Please try again later.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <div className="w-full max-w-md h-screen mx-auto flex flex-col justify-center space-y-6">
      <form onSubmit={handleResetPassword}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Forgot Password</FieldLegend>
            <FieldDescription>
              Enter your email address below and we&apos;ll send you a link to
              reset your password.
            </FieldDescription>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                {error}
              </div>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="penguin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Reset Password</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};

export default ForgetPassword;
