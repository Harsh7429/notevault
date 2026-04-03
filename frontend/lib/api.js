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

export async function fetchFiles() {
  const payload = await request("/api/files");
  return payload.data || [];
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

export async function loginUser(input) {
  const payload = await request("/api/login", {
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
  const payload = await request("/api/create-order", {
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
  formData.append("title", input.title);
  formData.append("description", input.description || "");
  formData.append("subject", input.subject || "");
  formData.append("course", input.course || "");
  formData.append("semester", input.semester || "");
  formData.append("unitLabel", input.unitLabel || "");
  formData.append("pageCount", input.pageCount ? String(input.pageCount) : "");
  formData.append("isFeatured", input.isFeatured ? "true" : "false");
  formData.append("price", String(input.price));

  if (input.thumbnail) {
    formData.append("thumbnail", input.thumbnail);
  }
}

export async function uploadAdminFile(token, input) {
  const formData = new FormData();
  appendFileFields(formData, input);

  if (input.file) {
    formData.append("file", input.file);
  }

  const payload = await request("/api/admin/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  return payload.data.file;
}

export async function updateAdminFile(token, fileId, input) {
  const payload = await request(`/api/admin/file/${fileId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description || "",
      subject: input.subject || "",
      course: input.course || "",
      semester: input.semester || "",
      unitLabel: input.unitLabel || "",
      pageCount: input.pageCount ? String(input.pageCount) : "",
      isFeatured: input.isFeatured,
      price: String(input.price),
      thumbnail: input.thumbnail || ""
    })
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

export async function fetchAdminSales(token) {
  const payload = await request("/api/admin/sales", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data;
}

export { API_BASE_URL };
