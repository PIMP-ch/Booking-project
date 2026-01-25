import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5008/api";

// --- Helper for Error Handling ---
const handleError = (error, defaultMessage) => {
  throw error.response?.data || { message: defaultMessage };
};

// ==========================================
// 1. STAFF & AUTH
// ==========================================
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/staff/login`, { email, password });
    return response.data;
  } catch (error) { handleError(error, "An error occurred during login"); }
};

export const getAllStaff = async () => {
  try {
    const response = await axios.get(`${API_URL}/staff`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch staff data"); }
};

export const createStaff = async (staffData) => {
  try {
    const response = await axios.post(`${API_URL}/staff`, staffData);
    return response.data;
  } catch (error) { handleError(error, "Failed to create staff"); }
};

export const updateStaff = async (id, staffData) => {
  try {
    const response = await axios.put(`${API_URL}/staff/${id}`, staffData);
    return response.data;
  } catch (error) { handleError(error, "Failed to update staff"); }
};

export const deleteStaff = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/staff/${id}`);
    return response.data;
  } catch (error) { handleError(error, "Failed to delete staff"); }
};

// ==========================================
// 2. EQUIPMENTS
// ==========================================
export const getAllEquipment = async () => {
  try {
    const response = await axios.get(`${API_URL}/equipments`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch equipment data"); }
};

export const createEquipment = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/equipments`, data);
    return response.data;
  } catch (error) { handleError(error, "Failed to create equipment"); }
};

export const updateEquipment = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/equipments/${id}`, data);
    return response.data;
  } catch (error) { handleError(error, "Failed to update equipment"); }
};

export const deleteEquipment = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipments/${id}`);
    return response.data;
  } catch (error) { handleError(error, "Failed to delete equipment"); }
};

export const uploadEquipmentImage = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(`${API_URL}/equipments/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) { handleError(error, "Failed to upload equipment image"); }
};

// --- แก้ไข: ตรวจสอบการส่ง ID ไปยัง Backend เพื่อลบรูปอุปกรณ์ ---
export const deleteEquipmentImage = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipments/${id}/image`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to delete equipment image");
  }
};

// ==========================================
// 3. STADIUMS
// ==========================================
export const getAllStadiums = async () => {
  try {
    const response = await axios.get(`${API_URL}/stadiums`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch stadium data"); }
};

export const createStadium = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/stadiums`, data);
    return response.data;
  } catch (error) { handleError(error, "Failed to create stadium"); }
};

export const updateStadium = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/stadiums/${id}`, data);
    return response.data;
  } catch (error) { handleError(error, "Failed to update stadium"); }
};

export const deleteStadium = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/stadiums/${id}`);
    return response.data;
  } catch (error) { handleError(error, "Failed to delete stadium"); }
};

export const uploadStadiumImages = async (id, files = [], externalUrls = []) => {
  try {
    const formData = new FormData();

    // 1. จัดการไฟล์จากเครื่อง (ถ้ามี)
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });
    }

    // 2. จัดการ URL จากภายนอก (ถ้ามี)
    // ส่งไปในรูปแบบ JSON string หรือส่งแยก field เพื่อให้ Backend รับได้
    if (externalUrls && externalUrls.length > 0) {
      externalUrls.forEach(url => {
        formData.append("externalUrls", url);
      });
    }

    const response = await axios.post(`${API_URL}/stadiums/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) { 
    handleError(error, "Failed to upload stadium images"); 
  }
};

// --- แก้ไข: ปรับให้รองรับการลบรูปตาม Index ของอาเรย์รูปภาพ ---
export const deleteStadiumImage = async (id, index = 0) => {
    try {
        // ยิงไปที่ /stadiums/:id/images/:index
        const response = await axios.delete(`${API_URL}/stadiums/${id}/images/${index}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete stadium image" };
    }
};

// ==========================================
// 4. USERS MANAGEMENT
// ==========================================
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/AllUser`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch users"); }
};

export const blockUser = async (id, days) => {
  try {
    const response = await axios.put(`${API_URL}/auth/block-user/${id}`, { days });
    return response.data;
  } catch (error) { handleError(error, "Failed to block user"); }
};

export const unblockUser = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/auth/unblock-user/${id}`);
    return response.data;
  } catch (error) { handleError(error, "Failed to unblock user"); }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/auth/${id}`);
    return response.data;
  } catch (error) { handleError(error, "Failed to delete user"); }
};

// ==========================================
// 5. BOOKINGS
// ==========================================
export const getAllBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch bookings"); }
};

export const confirmBooking = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/bookings/${id}/confirm`);
    return response.data;
  } catch (error) { handleError(error, "Failed to confirm booking"); }
};

export const cancelBooking = async (id, cancelReason = "") => {
  try {
    const response = await axios.put(`${API_URL}/bookings/${id}/cancel`, { cancelReason });
    return response.data;
  } catch (error) { handleError(error, "Failed to cancel booking"); }
};

export const resetBookingStatus = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/bookings/${id}/reset`);
    return response.data;
  } catch (error) { handleError(error, "Failed to reset booking status"); }
};

export const getReturnedBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings/history/returned`);
    return response.data;
  } catch (error) { 
    console.error("Error fetching returned bookings:", error);
    return []; 
  }
};

// ==========================================
// 6. STATISTICS & BUILDINGS
// ==========================================
export const getMonthlyBookingStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats/monthly`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch monthly booking stats"); }
};

export const getDailyBookingStats = async (month, year = new Date().getFullYear()) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats/daily`, {
      params: { month, year },
    });
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch daily booking stats"); }
};

export const getBuildings = async () => {
  try {
    const response = await axios.get(`${API_URL}/buildings`);
    return response.data;
  } catch (error) { handleError(error, "Failed to fetch buildings"); }
};

export const getTotalUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/users`);
    return response.data.totalUsers;
  } catch (error) { handleError(error, "Failed to fetch total users"); }
};

export const getPendingBookingsCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/bookings/pending`);
    return response.data.pendingBookings;
  } catch (error) { handleError(error, "Failed to fetch pending bookings count"); }
};