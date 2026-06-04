"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import {
  createStudyPlan,
  updateStudyPlan,
  createOrGetResource,
} from "@/lib/api";
import { toast } from "sonner";
import BasicInfoForm from "./components/BasicInfoForm";
import AddResourceForm from "./components/AddResourceForm";
import ResourceList from "./components/ResourceList";

export default function CreateStudyPlanPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    courseCode: "",
    isPublic: false,
  });

  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState({
    type: "youtube-video",
    url: "",
    title: "",
    pages: "",
    minsPerPage: "3",
    estimatedMins: "",
  });

  const [loading, setLoading] = useState(false);
  const [addingResource, setAddingResource] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddResource = async () => {
    if (!resourceForm.url) {
      toast.error("Please enter a URL");
      return;
    }

    // Validation for custom-link
    if (resourceForm.type === "custom-link" && !resourceForm.title) {
      toast.error("Please provide a title for custom link");
      return;
    }

    try {
      setAddingResource(true);

      let resourceData = {
        type: resourceForm.type,
        url: resourceForm.url,
      };

      // Add type-specific fields
      if (resourceForm.type === "pdf") {
        if (!resourceForm.title || !resourceForm.pages) {
          toast.error("Please fill in all PDF fields");
          return;
        }
        resourceData = {
          ...resourceData,
          title: resourceForm.title,
          pages: parseInt(resourceForm.pages),
          minsPerPage: parseInt(resourceForm.minsPerPage),
        };
      } else if (resourceForm.type === "article") {
        if (!resourceForm.title || !resourceForm.estimatedMins) {
          toast.error("Please fill in all article fields");
          return;
        }
        resourceData = {
          ...resourceData,
          title: resourceForm.title,
          estimatedMins: parseInt(resourceForm.estimatedMins),
        };
      } else if (
        resourceForm.type === "google-drive" ||
        resourceForm.type === "custom-link"
      ) {
        // For google-drive and custom-link, store the link with optional title and estimatedMins
        if (resourceForm.title) {
          resourceData.title = resourceForm.title;
        }
        if (resourceForm.estimatedMins) {
          resourceData.estimatedMins = parseInt(resourceForm.estimatedMins);
        }
      }

      const result = await createOrGetResource(resourceData, token);

      if (resourceForm.type === "youtube-playlist" && result.resources) {
        // Filter out duplicates from playlist
        const existingIds = new Set(resources.map((r) => r._id.toString()));
        const newResources = result.resources.filter(
          (r) => !existingIds.has(r._id.toString())
        );
        const duplicateCount = result.resources.length - newResources.length;

        if (newResources.length > 0) {
          setResources((prev) => [...prev, ...newResources]);
        }

        if (duplicateCount > 0) {
          toast.success(
            `Added ${newResources.length} video(s), ${duplicateCount} already in plan`
          );
        } else {
          toast.success(`Added ${newResources.length} video(s) from playlist`);
        }
      } else if (result.resource) {
        // Check if resource already exists in the plan
        const isDuplicate = resources.some(
          (r) => r._id.toString() === result.resource._id.toString()
        );

        if (isDuplicate) {
          toast.error("This resource is already in your plan");
        } else {
          // Add single resource
          setResources((prev) => [...prev, result.resource]);
          toast.success(
            result.isNew ? "Resource added" : "Existing resource added"
          );
        }
      }

      // Reset form
      setResourceForm({
        type: "youtube-video",
        url: "",
        title: "",
        pages: "",
        minsPerPage: "3",
        estimatedMins: "",
      });
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error(error.message || "Failed to add resource");
    } finally {
      setAddingResource(false);
    }
  };

  const handleRemoveResource = (index) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
    toast.success("Resource removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.shortDescription || !formData.courseCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Create study plan
      const planData = {
        ...formData,
        resourceIds: [],
      };

      const planResult = await createStudyPlan(planData, token);
      const planId = planResult.studyPlan._id;

      // Add resources to the plan if any
      if (resources.length > 0) {
        const resourceIds = resources.map((r) => r._id);
        await updateStudyPlan(planId, { resourceIds }, token);
      }

      toast.success("Study plan created successfully!");
      router.push(`/plans/${planId}`);
    } catch (error) {
      console.error("Error creating study plan:", error);
      toast.error("Failed to create study plan");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/my-plans"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Plans
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">
          Create Study Plan
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoForm formData={formData} onChange={handleInputChange} />

          <AddResourceForm
            resourceForm={resourceForm}
            onChange={handleResourceFormChange}
            onAdd={handleAddResource}
            isAdding={addingResource}
          />

          <ResourceList
            resources={resources}
            onReorder={setResources}
            onRemove={handleRemoveResource}
          />

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Study Plan"
              )}
            </button>
            <Link
              href="/my-plans"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-base font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
