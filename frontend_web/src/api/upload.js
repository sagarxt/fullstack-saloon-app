import axiosClient from "./axiosClient";

/**
 * Upload an image file (or remote URL) to Cloudinary via backend
 * @param {File|Blob|String} fileOrUrl 
 * @param {string} folder - 'groomishnow/category' | 'groomishnow/service' | 'groomishnow/product' | 'groomishnow/templates'
 * @returns {Promise<{url: string, folder: string}>}
 */
export const uploadImageApi = async (fileOrUrl, folder = "groomishnow") => {
  const formData = new FormData();
  if (typeof fileOrUrl === "string") {
    formData.append("fileUrl", fileOrUrl);
  } else {
    formData.append("file", fileOrUrl);
  }
  formData.append("folder", folder);

  const res = await axiosClient.post("/admin/upload", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  return res.data;
};

export default { uploadImageApi };
