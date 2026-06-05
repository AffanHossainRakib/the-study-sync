"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const SignupForm = ({
  className,
  setName,
  setEmail,
  setProfilePicture,
  setPassword,
  handleSignup,
  loading,
  error,
  setError,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfilePicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  return (
    <form
      onSubmit={handleSignup}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your details below to create a new account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Field className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
            {error}
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Mr. Penguin"
            required
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="penguin@example.com"
            required
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profilePicture">Profile Picture (Optional)</FieldLabel>
          <FieldDescription className="text-xs text-muted-foreground mb-2">
            Upload an image or leave empty to use a default avatar
          </FieldDescription>
          <Input
            id="profilePicture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="cursor-pointer"
          />
          {imagePreview && (
            <div className="mt-3 flex justify-center">
              <img
                src={imagePreview}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            </div>
          )}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </Field>

        <Field>
          {loading ? (
            <Button disabled className="flex flex-row gap-2">
              Signing up...
            </Button>
          ) : (
            <Button type="submit">Sign up</Button>
          )}
        </Field>

        <Field>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};

export default SignupForm;
