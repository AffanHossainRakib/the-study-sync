"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Clock,
  FileText,
  Users,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { getStudyPlans, formatTime } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function AllPlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on filter change
      fetchPlans(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, courseFilter, sortBy]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPlans(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchPlans = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = {
        view: "public",
        sort: sortBy,
        page: pageNum,
        limit: 9,
        search: searchTerm,
        courseCode: courseFilter,
      };
      const data = await getStudyPlans(params, token);
      setPlans(data.plans || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/5 to-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            All Study Plans
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse public study plans created by the community. Start an
            instance to begin learning.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Course Code Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by course code (e.g., CSE110)..."
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
                : "Be the first to create a study plan!"}
            </p>
            <Link
              href="/create-plan"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
            >
              Create Study Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => {
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {plan.courseCode}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="font-medium">
                            {plan.instanceCount || 0}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {plan.courseCode} - {plan.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
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
                      </div>

                      {/* Creator Info */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {(
                            plan.createdBy?.displayName ||
                            plan.createdBy?.email ||
                            "A"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          By{" "}
                          <span className="font-medium text-foreground">
                            {plan.createdBy?.displayName ||
                              plan.createdBy?.email?.split("@")[0] ||
                              "Anonymous"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-muted/50 border-t border-border">
                      <Link
                        href={`/plans/${String(plan._id)}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
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
      </div>
    </div>
  );
}
