"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileText,
  Youtube,
  ExternalLink,
  CheckCircle2,
  Circle,
  Edit,
  Play,
  StickyNote,
  Info,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  GripVertical,
  Trash2,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import {
  getInstanceById,
  toggleResourceCompletion,
  formatTime,
  getResourceTypeInfo,
  saveResourceNotes,
  updateInstance,
  createOrGetResource,
} from "@/lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import InstanceEditor from "@/components/InstanceEditor";
import EditInstanceModal from "@/components/EditInstanceModal";
import EmbeddedMediaPlayer from "@/components/EmbeddedMediaPlayer";

export default function InstanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  // Sortable Item Component for drag and drop
  const SortableResourceItem = ({ resource, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: resource._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const typeInfo = getResourceTypeInfo(resource.type);
    const Icon = typeInfo.icon === "Youtube" ? Youtube : FileText;
    const totalTime =
      resource.type === "youtube-video"
        ? resource.metadata?.duration
        : resource.type === "pdf"
          ? (resource.metadata?.pages || 0) *
            (resource.metadata?.minsPerPage || 0)
          : resource.metadata?.estimatedMins || 0;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 p-3 border-b border-slate-100 dark:border-slate-800 ${
          isDragging
            ? "bg-blue-50 dark:bg-blue-900/20 shadow-lg z-50"
            : "bg-white dark:bg-slate-900"
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-slate-400" />
        </div>

        {/* Icon */}
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
            resource.type === "youtube-video"
              ? "bg-red-100 dark:bg-red-900/30"
              : resource.type === "pdf"
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-green-100 dark:bg-green-900/30"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              resource.type === "youtube-video"
                ? "text-red-600"
                : resource.type === "pdf"
                  ? "text-blue-600"
                  : "text-green-600"
            }`}
          />
        </div>

        {/* Editable Title */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={editedCustomTitles[resource._id] ?? resource.title}
            onChange={(e) => handleTitleChange(resource._id, e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
            placeholder="Resource title"
          />
          <div className="text-xs text-slate-500 mt-0.5">
            {typeInfo.label} • {formatTime(totalTime)}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => handleDeleteResource(resource._id)}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
          title="Remove resource"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingResource, setTogglingResource] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [resourceNotes, setResourceNotes] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [showFeatureHints, setShowFeatureHints] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const saveNotesTimeoutRef = useRef(null);
  const autoCompletingResourcesRef = useRef(new Set());

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResources, setEditedResources] = useState([]);
  const [editedCustomTitles, setEditedCustomTitles] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [addingResource, setAddingResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    type: "youtube-video",
    url: "",
    title: "",
    pages: "",
    minsPerPage: "3",
    estimatedMins: "",
  });

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Check if first time viewing this page (for feature hints)
  useEffect(() => {
    const hasSeenHints = localStorage.getItem("hasSeenInstanceFeatureHints");
    if (!hasSeenHints) {
      setShowFeatureHints(true);
    }
  }, []);

  const dismissHints = () => {
    setShowFeatureHints(false);
    localStorage.setItem("hasSeenInstanceFeatureHints", "true");
  };

  // Load resource notes from instance data (database)
  useEffect(() => {
    if (instance?.resourceNotes) {
      setResourceNotes(instance.resourceNotes);
    }
  }, [instance?.resourceNotes]);

  // Auto-select first incomplete resource when instance loads
  useEffect(() => {
    if (instance?.resources?.length > 0 && !selectedResourceId) {
      // Find first incomplete resource, or first resource if all complete
      const firstIncomplete = instance.resources.find((r) => !r.completed);
      const resourceToSelect = firstIncomplete || instance.resources[0];
      setSelectedResourceId(resourceToSelect._id);
    }
  }, [instance?.resources, selectedResourceId]);

  const fetchInstanceDetails = useCallback(async () => {
    if (!params.id || !token) return;

    try {
      setLoading(true);
      const data = await getInstanceById(params.id, token);
      setInstance(data);
    } catch (error) {
      console.error("Error fetching instance:", error);
      toast.error("Failed to load instance");
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  // Handle playing next resource
  const handlePlayNext = useCallback(
    (completedResourceId) => {
      if (!instance?.resources) return;

      const currentResourceId = completedResourceId || selectedResourceId;
      if (!currentResourceId) return;

      const currentIndex = instance.resources.findIndex(
        (r) => r._id === currentResourceId,
      );
      if (currentIndex < instance.resources.length - 1) {
        setSelectedResourceId(instance.resources[currentIndex + 1]._id);
      }
    },
    [instance?.resources, selectedResourceId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (params.id && token) {
      fetchInstanceDetails();
    }
  }, [params.id, user, token, authLoading, router, fetchInstanceDetails]);

  const handleToggleComplete = async (resourceId, currentStatus) => {
    try {
      setTogglingResource(resourceId);
      const newStatus = !currentStatus;

      await toggleResourceCompletion(
        instance._id,
        resourceId,
        newStatus,
        token,
      );

      setInstance((prevInstance) => {
        const updatedResources = prevInstance.resources.map((res) =>
          res._id === resourceId
            ? {
                ...res,
                completed: newStatus,
                completedAt: newStatus ? new Date().toISOString() : null,
              }
            : res,
        );

        const completedCount = updatedResources.filter(
          (r) => r.completed,
        ).length;
        const totalCount = updatedResources.length;
        const resourcePercent =
          totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        const completedTime = updatedResources.reduce((sum, res) => {
          if (!res.completed) return sum;
          const time =
            res.type === "youtube-video"
              ? res.metadata?.duration || 0
              : res.type === "pdf"
                ? (res.metadata?.pages || 0) * (res.metadata?.minsPerPage || 0)
                : res.metadata?.estimatedMins || 0;
          return sum + time;
        }, 0);

        const totalTime = prevInstance.totalTime || 0;
        const timePercent =
          totalTime > 0 ? (completedTime / totalTime) * 100 : 0;

        return {
          ...prevInstance,
          resources: updatedResources,
          completedResources: completedCount,
          resourcePercent,
          completedTime,
          timePercent,
          remainingTime: totalTime - completedTime,
        };
      });

      toast.success(
        currentStatus ? "Marked as incomplete" : "Marked as complete!",
      );
    } catch (error) {
      console.error("Error toggling completion:", error);
      toast.error("Failed to update progress");
      await fetchInstanceDetails();
    } finally {
      setTogglingResource(null);
    }
  };

  const handleUpdate = (updatedInstance) => {
    setInstance((prev) => ({ ...prev, ...updatedInstance }));
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    if (!isEditMode) {
      // Enter edit mode - copy current resources for editing
      setEditedResources([...instance.resources]);
      setEditedCustomTitles(instance.customTitles || {});
      setIsEditMode(true);
    } else {
      // Cancel edit mode
      setIsEditMode(false);
      setEditedResources([]);
      setEditedCustomTitles({});
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setEditedResources((items) => {
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // Handle title change
  const handleTitleChange = (resourceId, newTitle) => {
    setEditedCustomTitles((prev) => ({
      ...prev,
      [resourceId]: newTitle,
    }));
  };

  // Handle delete resource
  const handleDeleteResource = (resourceId) => {
    if (!confirm("Are you sure you want to remove this resource?")) return;
    setEditedResources((prev) => prev.filter((r) => r._id !== resourceId));
    // Also remove custom title if exists
    const newTitles = { ...editedCustomTitles };
    delete newTitles[resourceId];
    setEditedCustomTitles(newTitles);
  };

  // Handle add resource - open modal
  const handleAddResource = () => {
    setShowAddResourceModal(true);
  };

  // Handle resource form change
  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit add resource
  const handleSubmitAddResource = async () => {
    if (!resourceForm.url) {
      toast.error("Please enter a URL");
      return;
    }

    setAddingResource(true);
    try {
      const data = await createOrGetResource(resourceForm, token);
      const newResource = data.resource;

      // Check if resource already exists in this instance
      const alreadyExists = editedResources.some(
        (r) => r._id === newResource._id || r.url === newResource.url,
      );

      if (alreadyExists) {
        toast.error("This resource already exists in this instance");
        setShowAddResourceModal(false);
        // Reset form
        setResourceForm({
          type: "youtube-video",
          url: "",
          title: "",
          pages: "",
          minsPerPage: "3",
          estimatedMins: "",
        });
        return;
      }

      setEditedResources((prev) => [...prev, newResource]);

      // Show appropriate message based on whether resource was new or existing
      if (data.isNew === false) {
        toast.success("Existing resource added to instance");
      } else {
        toast.success("Resource created and added successfully");
      }

      setShowAddResourceModal(false);
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
      console.error(error);
      toast.error("Failed to add resource");
    } finally {
      setAddingResource(false);
    }
  };

  // Save changes
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const payload = {
        resourceIds: editedResources.map((r) => r._id),
        customTitles: editedCustomTitles,
      };

      await updateInstance(instance._id, payload, token);

      // Refetch instance to get updated resources with proper population
      await fetchInstanceDetails();

      setIsEditMode(false);
      setEditedResources([]);
      setEditedCustomTitles({});
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Get selected resource
  const selectedResource = instance?.resources?.find(
    (r) => r._id === selectedResourceId,
  );
  const selectedIndex =
    instance?.resources?.findIndex((r) => r._id === selectedResourceId) ?? -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-6" />
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
              </div>
              <div className="w-80 hidden lg:block">
                <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!instance || !user) return null;

  const progressPercent = instance.resourcePercent || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/instances"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {instance.studyPlanId?.courseCode &&
                    `${instance.studyPlanId.courseCode} - `}
                  {instance.customTitle ||
                    instance.studyPlanId?.title ||
                    "Untitled"}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {instance.completedResources || 0}/
                    {instance.totalResources || 0} completed
                  </span>
                  <span>•</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    title="Save changes"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleToggleEditMode}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-500">
                    Click Edit to edit the instance
                  </span>
                  <button
                    onClick={handleToggleEditMode}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Edit mode"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  {/* <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit instance details"
                  >
                    <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </button> */}
                </>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feature Hints Removed per user request */}

      {/* Main Content - YouTube Style Layout */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div
          className={`flex flex-col ${theaterMode ? "" : "lg:flex-row"} gap-6`}
        >
          {/* Left: Main Player Area */}
          <div className={`min-w-0 ${theaterMode ? "w-full" : "flex-1"}`}>
            {selectedResource ? (
              <>
                {/* Video Player */}
                <div
                  className={`bg-black rounded-xl overflow-hidden shadow-2xl ${
                    theaterMode ? "min-h-[70vh]" : ""
                  }`}
                >
                  <EmbeddedMediaPlayer
                    resource={selectedResource}
                    instanceId={instance._id}
                    isExpanded={true}
                    theaterMode={theaterMode}
                    onClose={() => {}}
                    onComplete={(completedResourceId) => {
                      if (!completedResourceId || !instance?.resources) return;

                      const completedResource = instance.resources.find(
                        (resource) => resource._id === completedResourceId,
                      );

                      if (
                        !completedResource ||
                        completedResource.completed ||
                        autoCompletingResourcesRef.current.has(
                          completedResourceId,
                        )
                      ) {
                        return;
                      }

                      autoCompletingResourcesRef.current.add(
                        completedResourceId,
                      );
                      handleToggleComplete(completedResourceId, false).finally(
                        () => {
                          autoCompletingResourcesRef.current.delete(
                            completedResourceId,
                          );
                        },
                      );
                    }}
                    onPlayNext={handlePlayNext}
                  />
                </div>

                {/* Theater Mode Toggle */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setTheaterMode(!theaterMode)}
                    className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={
                      theaterMode ? "Exit theater mode (T)" : "Theater mode (T)"
                    }
                  >
                    {theaterMode ? (
                      <>
                        <Minimize2 className="h-4 w-4" /> Exit Theater
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" /> Theater Mode
                      </>
                    )}
                  </button>
                </div>

                {/* Video Info */}
                <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
                  {/* Title - Full width */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {selectedIndex + 1}. {selectedResource.title}
                  </h2>

                  {/* Info and Actions - Stack on mobile, row on desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium ${
                          selectedResource.type === "youtube-video"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : selectedResource.type === "pdf"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {getResourceTypeInfo(selectedResource.type).label}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-4 w-4" />
                        {formatTime(
                          selectedResource.type === "youtube-video"
                            ? selectedResource.metadata?.duration
                            : selectedResource.type === "pdf"
                              ? (selectedResource.metadata?.pages || 0) *
                                (selectedResource.metadata?.minsPerPage || 0)
                              : selectedResource.metadata?.estimatedMins || 0,
                        )}
                      </span>
                      {selectedResource.completed && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 group relative">
                        <span className="hidden md:block text-xs text-slate-500 font-medium">
                          Take Notes
                        </span>
                        <button
                          onClick={() => setShowNotes(!showNotes)}
                          className={`p-2 rounded-lg transition-all ${
                            showNotes || resourceNotes[selectedResource._id]
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                          }`}
                          title="Toggle notes"
                        >
                          <StickyNote className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleToggleComplete(
                            selectedResource._id,
                            selectedResource.completed,
                          )
                        }
                        disabled={togglingResource === selectedResource._id}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedResource.completed
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {selectedResource.completed
                          ? "✓ Completed"
                          : "Mark Complete"}
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={selectedResource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {showNotes && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Your Notes
                      </label>
                      <textarea
                        placeholder="Add your notes for this resource..."
                        value={resourceNotes[selectedResource._id] || ""}
                        onChange={(e) =>
                          saveResourceNote(selectedResource._id, e.target.value)
                        }
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                        <span>Auto-saved • Synced across devices</span>
                        {savingNotes && (
                          <span className="text-blue-500">Saving...</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <p className="text-slate-500">Select a resource to play</p>
              </div>
            )}
          </div>

          {/* Right: Playlist Sidebar */}
          {!theaterMode && (
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-36">
                {/* Playlist Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {isEditMode ? "Edit Resources" : "Playlist"} •{" "}
                        {(isEditMode ? editedResources : instance.resources)
                          ?.length || 0}{" "}
                        items
                      </h3>
                      {!isEditMode && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>
                            {instance.completedResources || 0} completed
                          </span>
                          <span>•</span>
                          <span>
                            {formatTime(instance.remainingTime || 0)} remaining
                          </span>
                        </div>
                      )}

                      {isEditMode && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <div className="flex items-center gap-2">
                            <Edit className="h-3 w-3" />
                            <span>Click on the title to rename</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3 w-3" />
                            <span>Drag handles to reorder</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-3 w-3" />
                            <span>Remove unneeded items</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            <span>Click Add to add new items</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {isEditMode && (
                      <button
                        onClick={handleAddResource}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Add resource"
                      >
                        <Plus className="h-6 w-6" />
                        Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Playlist Items */}
                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {isEditMode ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={editedResources.map((r) => r._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {editedResources.map((resource, index) => (
                          <SortableResourceItem
                            key={resource._id}
                            resource={resource}
                            index={index}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    instance.resources?.map((resource, index) => {
                      const isSelected = selectedResourceId === resource._id;
                      const isCompleted = resource.completed;
                      const typeInfo = getResourceTypeInfo(resource.type);
                      const Icon =
                        typeInfo.icon === "Youtube" ? Youtube : FileText;
                      const totalTime =
                        resource.type === "youtube-video"
                          ? resource.metadata?.duration
                          : resource.type === "pdf"
                            ? (resource.metadata?.pages || 0) *
                              (resource.metadata?.minsPerPage || 0)
                            : resource.metadata?.estimatedMins || 0;

                      return (
                        <button
                          key={resource._id}
                          onClick={() => setSelectedResourceId(resource._id)}
                          className={`w-full flex items-start gap-3 p-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          {/* Playing indicator or index */}
                          <div className="w-6 shrink-0 flex items-center justify-center">
                            {isSelected ? (
                              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400 fill-current" />
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* Thumbnail/Icon */}
                          <div
                            className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                              resource.type === "youtube-video"
                                ? "bg-red-100 dark:bg-red-900/30"
                                : resource.type === "pdf"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-green-100 dark:bg-green-900/30"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                resource.type === "youtube-video"
                                  ? "text-red-600 dark:text-red-400"
                                  : resource.type === "pdf"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-green-600 dark:text-green-400"
                              }`}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-medium truncate ${
                                isCompleted
                                  ? "text-slate-400 line-through"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {resource.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{formatTime(totalTime)}</span>
                              {resourceNotes[resource._id] && (
                                <StickyNote className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </div>

                          {/* Completion Status */}
                          <div className="shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Theater Mode: Playlist Strip Below */}
          {theaterMode && (
            <div className="w-full mt-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Up Next • {instance.resources?.length || 0} items
                  </span>
                  <span className="text-xs text-slate-500">
                    {instance.completedResources || 0}/
                    {instance.totalResources || 0} completed
                  </span>
                </div>
                <div className="overflow-y-auto">
                  {instance.resources?.map((resource, index) => {
                    const isSelected = selectedResourceId === resource._id;
                    const isCompleted = resource.completed;
                    const typeInfo = getResourceTypeInfo(resource.type);
                    const Icon =
                      typeInfo.icon === "Youtube" ? Youtube : FileText;
                    const totalTime =
                      resource.type === "youtube-video"
                        ? resource.metadata?.duration
                        : resource.type === "pdf"
                          ? (resource.metadata?.pages || 0) *
                            (resource.metadata?.minsPerPage || 0)
                          : resource.metadata?.estimatedMins || 0;

                    return (
                      <button
                        key={resource._id}
                        onClick={() => setSelectedResourceId(resource._id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <span className="w-6 text-center text-xs text-slate-400 font-medium">
                          {isSelected ? (
                            <Play className="h-4 w-4 text-blue-600 fill-current mx-auto" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            resource.type === "youtube-video"
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              resource.type === "youtube-video"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm font-medium truncate block ${
                              isCompleted
                                ? "text-slate-400 line-through"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {resource.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTime(totalTime)}
                          </span>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Completion Message */}
        {progressPercent === 100 && (
          <div className="mt-8 bg-linear-to-r from-green-400 via-emerald-500 to-teal-500 rounded-2xl p-8 text-center text-white shadow-2xl">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
            <p className="text-white/90">
              You have completed all resources in this study plan.
            </p>
          </div>
        )}
      </div>

      <EditInstanceModal
        instance={instance}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdate}
        token={token}
      />

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Add Resource
                </h3>
                <button
                  onClick={() => setShowAddResourceModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Resource Type
                  </label>
                  <select
                    name="type"
                    value={resourceForm.type}
                    onChange={handleResourceFormChange}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="youtube-video">YouTube Video</option>
                    <option value="youtube-playlist">YouTube Playlist</option>
                    <option value="pdf">PDF Document</option>
                    <option value="article">Article/Blog Post</option>
                    <option value="google-drive">Google Drive Link</option>
                    <option value="custom-link">Custom Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={resourceForm.url}
                    onChange={handleResourceFormChange}
                    placeholder={
                      resourceForm.type === "youtube-video"
                        ? "https://www.youtube.com/watch?v=..."
                        : resourceForm.type === "youtube-playlist"
                          ? "https://www.youtube.com/playlist?list=..."
                          : resourceForm.type === "pdf"
                            ? "https://example.com/document.pdf"
                            : "https://example.com/resource"
                    }
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {["pdf", "article", "google-drive", "custom-link"].includes(
                  resourceForm.type,
                ) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Title {resourceForm.type === "custom-link" && "*"}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={resourceForm.title}
                      onChange={handleResourceFormChange}
                      placeholder="Resource title"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {resourceForm.type === "pdf" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Number of Pages
                      </label>
                      <input
                        type="number"
                        name="pages"
                        value={resourceForm.pages}
                        onChange={handleResourceFormChange}
                        placeholder="50"
                        min="1"
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Minutes per Page
                      </label>
                      <input
                        type="number"
                        name="minsPerPage"
                        value={resourceForm.minsPerPage}
                        onChange={handleResourceFormChange}
                        placeholder="3"
                        min="1"
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {(resourceForm.type === "article" ||
                  resourceForm.type === "google-drive" ||
                  resourceForm.type === "custom-link") && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      name="estimatedMins"
                      value={resourceForm.estimatedMins}
                      onChange={handleResourceFormChange}
                      placeholder="10"
                      min="1"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSubmitAddResource}
                  disabled={addingResource || !resourceForm.url}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {addingResource ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Add Resource
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddResourceModal(false)}
                  disabled={addingResource}
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
