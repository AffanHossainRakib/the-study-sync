// src/components/InstanceEditor.jsx
"use client";

import React, { useState } from "react";
// Note: This component is deprecated and no longer used in the app
// Editing is now handled inline in the instance page with @dnd-kit
import {
  updateInstance,
  createOrGetResource,
  getResourceTypeInfo,
  formatTime,
} from "@/lib/api";
import { X, Plus, Edit, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

const InstanceEditor = ({ instance, token, onUpdate }) => {
  const [resources, setResources] = useState(instance.resources || []);
  const [customTitles, setCustomTitles] = useState(instance.customTitles || {});

  const handleTitleChange = (id, title) => {
    setCustomTitles((prev) => ({ ...prev, [id]: title }));
  };

  const handleDelete = (id) => {
    setResources((prev) => prev.filter((r) => r._id !== id));
    const newTitles = { ...customTitles };
    delete newTitles[id];
    setCustomTitles(newTitles);
  };

  const handleAddResource = async () => {
    const url = window.prompt("Enter resource URL (YouTube video, PDF, etc.)");
    if (!url) return;
    try {
      const data = await createOrGetResource({ url }, token);
      // API returns { resource: {...}, isNew: boolean }
      const newRes = data.resource;
      setResources((prev) => [...prev, newRes]);
      toast.success("Resource added");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add resource");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(resources);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setResources(reordered);
  };

  const handleSave = async () => {
    const payload = {
      resourceIds: resources.map((r) => r._id),
      customTitles,
    };
    try {
      const updated = await updateInstance(instance._id, payload, token);
      toast.success("Instance saved");
      onUpdate(updated);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save instance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Resources</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddResource}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Resource
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-success text-success-foreground rounded-md hover:bg-success/90"
          >
            Save
          </button>
        </div>
      </div>
      {/* Drag and drop functionality removed - component is deprecated */}
      <div className="space-y-2">
        {resources.map((res, index) => (
          <div
            key={res._id}
            className="flex items-center gap-3 p-3 bg-background border rounded-md"
          >
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={customTitles[res._id] ?? res.title}
                onChange={(e) => handleTitleChange(res._id, e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm"
              />
              <div className="text-xs text-muted-foreground">
                {getResourceTypeInfo(res.type).label} •{" "}
                {formatTime(
                  res.type === "youtube-video"
                    ? res.metadata?.duration
                    : res.type === "pdf"
                    ? (res.metadata?.pages || 0) *
                      (res.metadata?.minsPerPage || 0)
                    : res.metadata?.estimatedMins || 0
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(res._id)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
              title="Delete"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstanceEditor;
