/**
 * API Utility Functions
 * Helper functions for making authenticated API calls to the backend
 */

import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/";

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/study-plans')
 * @param {string} method - HTTP method
 * @param {string} token - Firebase ID token
 * @param {object} body - Request body (for POST/PUT)
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, method = "GET", token = null, body = null) {
  const buildOptions = (authToken) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    return options;
  };

  const parseErrorResponse = async (response) => {
    try {
      return await response.json();
    } catch {
      return { error: "API request failed" };
    }
  };

  const refreshAuthToken = async () => {
    if (typeof window === "undefined" || !auth.currentUser) return null;

    try {
      const refreshedToken = await auth.currentUser.getIdToken(true);
      document.cookie = `auth-token=${refreshedToken}; path=/; max-age=3600; SameSite=Lax`;
      return refreshedToken;
    } catch (refreshError) {
      console.error("Token refresh during API retry failed:", refreshError);
      return null;
    }
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      buildOptions(token),
    );

    if (response.ok) {
      return await response.json();
    }

    // Retry once on auth failure with a force-refreshed token.
    if (response.status === 401 && token) {
      const refreshedToken = await refreshAuthToken();
      if (refreshedToken && refreshedToken !== token) {
        const retryResponse = await fetch(
          `${API_BASE_URL}${endpoint}`,
          buildOptions(refreshedToken),
        );

        if (retryResponse.ok) {
          return await retryResponse.json();
        }

        const retryError = await parseErrorResponse(retryResponse);
        throw new Error(
          retryError.message || retryError.error || "API request failed",
        );
      }
    }

    const error = await parseErrorResponse(response);
    throw new Error(error.message || error.error || "API request failed");
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// ==================== Study Plans ====================

export const getStudyPlans = async (params = {}, token = null) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/api/study-plans${queryString ? `?${queryString}` : ""}`;
  const data = await apiRequest(endpoint, "GET", token);
  return data;
};

export const getStudyPlanById = async (id, token = null, sortBy = "order") => {
  const endpoint =
    sortBy && sortBy !== "order"
      ? `/api/study-plans/${id}?sortBy=${sortBy}`
      : `/api/study-plans/${id}`;
  return apiRequest(endpoint, "GET", token);
};

export const createStudyPlan = async (data, token) => {
  return apiRequest("/api/study-plans", "POST", token, data);
};

export const updateStudyPlan = async (id, data, token) => {
  return apiRequest(`/api/study-plans/${id}`, "PUT", token, data);
};

export const deleteStudyPlan = async (id, token) => {
  return apiRequest(`/api/study-plans/${id}`, "DELETE", token);
};

export const shareStudyPlan = async (id, email, role = "editor", token) => {
  return apiRequest(`/api/study-plans/${id}/share`, "POST", token, {
    email,
    role,
  });
};

export const removeSharedAccess = async (id, emailOrUserId, token) => {
  const encoded = encodeURIComponent(emailOrUserId);
  return apiRequest(`/api/study-plans/${id}/share/${encoded}`, "DELETE", token);
};

export const removeCollaborator = async (id, userId, token) => {
  return apiRequest(
    `/api/study-plans/${id}/collaborators/${userId}`,
    "DELETE",
    token,
  );
};

// ==================== Resources ====================

export const createOrGetResource = async (data, token) => {
  return apiRequest("/api/resources", "POST", token, data);
};

export const getResourceById = async (id) => {
  return apiRequest(`/api/resources/${id}`, "GET");
};

export const getResourcesByIds = async (ids) => {
  const idsParam = Array.isArray(ids) ? ids.join(",") : ids;
  return apiRequest(`/api/resources/bulk?ids=${idsParam}`, "GET");
};

// ==================== Instances ====================

export const getInstances = async (token) => {
  return apiRequest("/api/instances", "GET", token);
};

export const getInstanceById = async (id, token) => {
  return apiRequest(`/api/instances/${id}`, "GET", token);
};

export const createInstance = async (data, token) => {
  return apiRequest("/api/instances", "POST", token, data);
};

export const updateInstance = async (id, data, token) => {
  return apiRequest(`/api/instances/${id}`, "PUT", token, data);
};

export const deleteInstance = async (id, token) => {
  return apiRequest(`/api/instances/${id}`, "DELETE", token);
};

export const saveResourceNotes = async (instanceId, resourceNotes, token) => {
  return apiRequest(`/api/instances/${instanceId}`, "PUT", token, {
    resourceNotes,
  });
};

// ==================== User Progress ====================

export const getUserProgress = async (token) => {
  return apiRequest("/api/user-progress", "GET", token);
};

export const toggleResourceCompletion = async (
  instanceId,
  resourceId,
  completed,
  token,
) => {
  return apiRequest("/api/user-progress", "POST", token, {
    instanceId,
    resourceId,
    completed,
  });
};

export const bulkToggleCompletion = async (resourceIds, completed, token) => {
  return apiRequest("/api/user-progress/bulk", "POST", token, {
    resourceIds,
    completed,
  });
};

export const checkResourcesCompletion = async (resourceIds, token) => {
  const idsParam = Array.isArray(resourceIds)
    ? resourceIds.join(",")
    : resourceIds;
  return apiRequest(
    `/api/user-progress/check?resourceIds=${idsParam}`,
    "GET",
    token,
  );
};

// ==================== Notifications ====================

export const getNotificationSettings = async (token) => {
  return apiRequest("/api/notifications/settings", "GET", token);
};

export const updateNotificationSettings = async (data, token) => {
  return apiRequest("/api/notifications/settings", "PUT", token, data);
};

export const sendTestEmail = async (token) => {
  return apiRequest("/api/notifications/test-email", "POST", token);
};

// ==================== Helper Functions ====================

/**
 * Format time in minutes to human-readable format
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time (e.g., "2h 30m", "45m")
 */
export function formatTime(minutes) {
  if (!minutes || minutes === 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Get resource type icon/label
 * @param {string} type - Resource type
 * @returns {object} Icon name and label
 */
export function getResourceTypeInfo(type) {
  switch (type) {
    case "youtube-video":
      return { icon: "Youtube", label: "Video", color: "text-red-600" };
    case "pdf":
      return { icon: "FileText", label: "PDF", color: "text-blue-600" };
    case "article":
      return { icon: "FileText", label: "Article", color: "text-green-600" };
    default:
      return { icon: "File", label: "Resource", color: "text-gray-600" };
  }
}

/**
 * Calculate progress percentage
 * @param {number} completed - Completed count
 * @param {number} total - Total count
 * @returns {number} Percentage (0-100)
 */
export function calculateProgress(completed, total) {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
}
