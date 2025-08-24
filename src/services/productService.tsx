import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;

export const getProducts = async () => {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`);
    return res.data; // { success, message, data: [...] }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch products" };
  }
};

export const createProduct = async (formData: FormData) => {
  try {
    const res = await axiosInstance.post(
      `${API_URL}/products/create`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data; // { success, message, data: {...newProduct} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to create product" };
  }
};

export const updateProduct = async (id: string, formData: FormData) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { success, message, data: {...updatedProduct} }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update product" };
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/products/${id}`);
    return res.data; // { success, message }
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to delete product" };
  }
};
