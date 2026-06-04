"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  FileText,
  ArrowRight,
  BookOpen,
  Loader2,
} from "lucide-react";
import { getStudyPlans, deleteStudyPlan, formatTime } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";

export default function MyStudyPlansPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Initial fetch when user and token are available
  useEffect(() => {
    if (user && token) {
      fetchMyPlans(1);
    }
  }, [user, token]);

  // Debounce search and filters
  useEffect(() => {
    if (user && token) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchMyPlans(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, courseFilter, sortBy]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchMyPlans(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchMyPlans = async (pageNum = page) => {
    if (!token) {
      console.log("No token available, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {
        view: "my",
        sort: sortBy,
        page: pageNum,
        limit: 9,
        search: searchTerm,
        courseCode: courseFilter,
      };
      console.log("Fetching my plans with params:", params);
      console.log("Token present:", !!token);
      console.log("User UID:", user?.uid);
      const data = await getStudyPlans(params, token);
      console.log("Received data:", data);
      setPlans(data.plans || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching plans:", error);
      console.error("Error details:", error.message);
      toast.error(error.message || "Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this study plan? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteStudyPlan(id, token);
      toast.success("Study plan deleted successfully");
      // Refresh to respect pagination
      fetchMyPlans(page);
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete study plan");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/5 to-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              My Study Plans
            </h1>
            <p className="text-lg text-muted-foreground">
              Plans you created or have been shared with you
            </p>
          </div>
          <Link
            href="/create-plan"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Plan
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Course Code Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Filter by course code..."
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </div>

          {/* Results Count */}
          {!loading && pagination && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {plans.length} of {pagination.totalPlans} study plans
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          /* Empty State */
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-16 text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No study plans found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || courseFilter
                ? "Try adjusting your filters"
                : "Create your first study plan to get started"}
            </p>
            <Link
              href="/create-plan"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Study Plan
            </Link>
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => {
                // Check if user is creator by comparing emails (most reliable)
                const creatorEmail =
                  typeof plan.createdBy === "object"
                    ? plan.createdBy.email
                    : null;
                const isCreator =
                  creatorEmail &&
                  user.email &&
                  creatorEmail.toLowerCase() === user.email.toLowerCase();
                const isShared = !isCreator;

                return (
                  <div
                    key={plan._id}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all"
                  >
                    {/* Header accent */}
                    <div className="h-1 bg-primary group-hover:h-2 transition-all" />

                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {plan.courseCode}
                          </span>
                          {isShared && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/15 text-info">
                              Shared
                            </span>
                          )}
                          {plan.isPublic && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                              Public
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(plan._id);
                          }}
                          disabled={deletingId === plan._id || !isCreator}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            isCreator
                              ? "Delete plan"
                              : "Only the creator can delete this plan"
                          }
                        >
                          {deletingId === plan._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {plan.courseCode} - {plan.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {plan.shortDescription}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-primary" />
                          <span className="font-medium">
                            {plan.resourceCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-primary/70" />
                          <span className="font-medium">
                            {formatTime(plan.totalTime)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-primary" />
                          <span className="font-medium">
                            {plan.instanceCount || 0}
                          </span>
                        </div>
                      </div>

                      {isShared && (
                        <div className="text-xs text-muted-foreground">
                          Created by{" "}
                          {plan.createdBy?.displayName ||
                            plan.createdBy?.email?.split("@")[0]}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
                      <Link
                        href={`/plans/${plan._id}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                      {(isCreator || plan.canEdit) && (
                        <Link
                          href={`/plans/${plan._id}/edit`}
                          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-6 py-2 bg-card border border-border rounded-xl text-sm font-medium text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-all"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-6 py-2 bg-card border border-border rounded-xl text-sm font-medium text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Quick Stats */}
        {plans.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-xl p-3 w-fit mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-1">
                {plans.length}
              </div>
              <div className="text-muted-foreground font-medium">
                Total Study Plans
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-xl p-3 w-fit mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-1">
                {
                  plans.filter((p) => {
                    const creatorId =
                      typeof p.createdBy === "object"
                        ? p.createdBy._id
                        : p.createdBy;
                    const creatorFirebaseUid =
                      typeof p.createdBy === "object"
                        ? p.createdBy.firebaseUid
                        : null;
                    return (
                      (creatorFirebaseUid && creatorFirebaseUid === user.uid) ||
                      (creatorId &&
                        user._id &&
                        creatorId.toString() === user._id.toString())
                    );
                  }).length
                }
              </div>
              <div className="text-muted-foreground font-medium">
                Created by You
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-xl p-3 w-fit mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-1">
                {
                  plans.filter((p) => {
                    const creatorId =
                      typeof p.createdBy === "object"
                        ? p.createdBy._id
                        : p.createdBy;
                    const creatorFirebaseUid =
                      typeof p.createdBy === "object"
                        ? p.createdBy.firebaseUid
                        : null;
                    const isCreator =
                      (creatorFirebaseUid && creatorFirebaseUid === user.uid) ||
                      (creatorId &&
                        user._id &&
                        creatorId.toString() === user._id.toString());
                    return !isCreator;
                  }).length
                }
              </div>
              <div className="text-muted-foreground font-medium">
                Shared with You
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
