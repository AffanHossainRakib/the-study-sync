"use client";

import SignupForm from "@/components/Auth/signup-from";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";

const Signup = () => {
  const { user, createUser, updateUsersFullName, updateUsersProfilePicture } =
    useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const uploadToImgBB = async (imageFile) => {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("ImgBB API key is not configured");
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error("Failed to upload image to ImgBB");
      }
    } catch (error) {
      throw new Error("Failed to upload image: " + error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    // Validate inputs (profile picture is now optional)
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      setLoading(false);
      return;
    }

    try {
      let profilePictureUrl = "";

      // Upload image to ImgBB if provided
      if (profilePicture && profilePicture instanceof File) {
        toast.loading("Uploading image...");
        profilePictureUrl = await uploadToImgBB(profilePicture);
        toast.dismiss();
      }

      // Create user account
      await createUser(email, password);
      await updateUsersFullName(name);

      // Only update profile picture if we have a URL
      if (profilePictureUrl) {
        await updateUsersProfilePicture(profilePictureUrl);
      }

      toast.success("Account created successfully!");
      router.push("/");
    } catch (err) {
      const errorMessage = err.message || "Failed to create account.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <>
      <SignupForm
        setName={setName}
        setEmail={setEmail}
        setPassword={setPassword}
        setProfilePicture={setProfilePicture}
        handleSignup={handleSignup}
        loading={loading}
        error={error}
        setError={setError}
      />
    </>
  );
};

export default Signup;
