const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Could not connect to the backend at ${API_BASE_URL}. Make sure the backend server is running and your local setup is configured.`);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Something went wrong while contacting the API.");
  }

  return payload;
}

export async function fetchFiles({ page = 1, limit = 50, search = "", subject = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page",  String(page));
  params.set("limit", String(limit));
  if (search)  params.set("search",  search);
  if (subject) params.set("subject", subject);
  const payload = await request(`/api/files?${params.toString()}`);
  return payload;   // return full payload (data + pagination) so callers can paginate if needed
}

export async function fetchAllFiles() {
  // Convenience wrapper: fetches all pages and concatenates results.
  // Uses the backend max page size (50) to minimise round-trips.
  const PAGE_SIZE = 50;
  let page = 1;
  let allItems = [];
  while (true) {
    const payload = await fetchFiles({ page, limit: PAGE_SIZE });
    const items = payload.data || [];
    allItems = allItems.concat(items);
    if (page >= (payload.pagination?.totalPages || 1)) break;
    page++;
  }
  return allItems;
}

export async function fetchFileById(id) {
  const payload = await request(`/api/files/${id}`);
  return payload.data;
}

export async function registerUser(input) {
  const payload = await request("/api/register", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.data;
}

// ⚠️  DEAD CODE — backend routes /api/register/verify-otp and /api/login/verify-otp
// are NOT wired up in auth.routes.js. The OTP service exists in
// backend/src/services/login-otp.service.js but routes + frontend form are missing.
// Do not call these until the backend routes and a UI OTP form are added.
export async function verifyRegistrationOtp(input) {
  const payload = await request("/api/register/verify-otp", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.data;
}

export async function loginUser(input) {
  const payload = await request("/api/login", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.data;
}

// ⚠️  DEAD CODE — see note above on verifyRegistrationOtp.
export async function verifyLoginOtp(input) {
  const payload = await request("/api/login/verify-otp", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.data;
}

export async function fetchCurrentUser(token) {
  const payload = await request("/api/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data.user;
}

export async function logoutUser(token) {
  return request("/api/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function createPaymentOrder(token, fileId) {
  const payload = await request(`/api/create-order/${fileId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ fileId })
  });

  return payload.data;
}

export async function verifyPayment(token, input) {
  const payload = await request("/api/verify-payment", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  return payload.data;
}

export async function fetchMyPurchases(token) {
  const payload = await request("/api/my-purchases", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data || [];
}

export async function fetchSecureViewerAccess(token, fileId) {
  const payload = await request(`/api/files/${fileId}/access`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data;
}

function appendFileFields(formData, input) {
  formData.append("title",            input.title);
  formData.append("description",      input.description      || "");
  formData.append("subject",          input.subject          || "");
  formData.append("course",           input.course           || "");
  formData.append("semester",         input.semester         || "");
  formData.append("unitLabel",        input.unitLabel        || "");
  formData.append("pageCount",        input.pageCount ? String(input.pageCount) : "");
  formData.append("isFeatured",       input.isFeatured ? "true" : "false");
  formData.append("price",            String(input.price));
  formData.append("downloadPassword", input.downloadPassword || "");

  if (input.thumbnail) {
    formData.append("thumbnail", input.thumbnail);
  }
}

export async function uploadAdminFile(token, input) {
  const formData = new FormData();
  appendFileFields(formData, input);
  if (input.file) formData.append("file", input.file);

  const payload = await request("/api/admin/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return payload.data.file;
}

/**
 * Uses FormData so it can optionally carry a replacement PDF file.
 * If input.file is null the backend treats this as a metadata-only update.
 */
export async function updateAdminFile(token, fileId, input) {
  const formData = new FormData();
  appendFileFields(formData, input);
  if (input.file) formData.append("file", input.file);

  const payload = await request(`/api/admin/file/${fileId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return payload.data.file;
}

export async function deleteAdminFile(token, fileId) {
  return request(`/api/admin/file/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function fetchAdminFiles(token) {
  const payload = await request("/api/admin/files", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload.data || [];
}

export async function fetchAdminSales(token) {
  const payload = await request("/api/admin/sales", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Guard against null/undefined payload.data — if the sales endpoint returns
  // an unexpected shape, return safe defaults instead of crashing the app.
  const data = payload?.data ?? {};
  return {
    totalFiles:       data.totalFiles       ?? 0,
    featuredProducts: data.featuredProducts ?? 0,
    subjectCount:     data.subjectCount     ?? 0,
    totalPurchases:   data.totalPurchases   ?? 0,
    totalRevenue:     data.totalRevenue     ?? 0,
    uniqueBuyers:     data.uniqueBuyers     ?? 0,
    topProducts:      Array.isArray(data.topProducts)     ? data.topProducts     : [],
    recentPurchases:  Array.isArray(data.recentPurchases) ? data.recentPurchases : [],
  };
}


export async function fetchDownloadPassword(token, fileId) {
  const payload = await request(`/api/files/${fileId}/download-password`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return payload.data;
}

export function buildDownloadUrl(fileId) {
  return `${API_BASE_URL}/api/files/${fileId}/download`;
}

export { API_BASE_URL };
