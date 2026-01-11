import axios from "axios";

// ให้ส่ง/รับคุกกี้กับ backend เสมอ (จำเป็นถ้าใช้ cookie-based auth)
axios.defaults.withCredentials = true;

// ✅ สำหรับประกอบลิงก์รูปภาพเช่น `${API_BASE}${stadium.imageUrl}`
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

// ✅ base สำหรับ REST API
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5008/api";

/* ===================== Auth: User ===================== */

// สมัครสมาชิก (หน้า user/register)
export const RegisterUser = async ({
  fullname,
  email,
  password,
  fieldOfStudy,
  year,
  phoneNumber,
  userType,
  department,
}) => {
  try {
    const payload = {
      fullname,
      email: String(email || "").trim().toLowerCase(),
      password,
      fieldOfStudy,
      year,
      userType,
      department,
      ...(phoneNumber ? { phoneNumber } : {}),
    };
    const res = await axios.post(`${API_URL}/auth/register`, payload);
    return res.data; // { success, message, user }
  } catch (error) {
    throw error.response?.data || { message: "สมัครสมาชิกไม่สำเร็จ" };
  }
};

// เข้าสู่ระบบผู้ใช้ (หน้า user/login)
export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: String(email || "").trim().toLowerCase(),
      password,
    });
    return res.data; // { success, message, user }
  } catch (error) {
    throw error.response?.data || { message: "เข้าสู่ระบบไม่สำเร็จ" };
  }
};

/* (ทางเลือก) ถ้ายังมีหน้าล็อกอินพนักงาน/แอดมินอยู่ ใช้ฟังก์ชันนี้แทนของเดิม */
export const loginStaff = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/staff/login`, { email, password });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "เข้าสู่ระบบพนักงานไม่สำเร็จ" };
  }
};

/* ===================== Users (Admin) ===================== */

export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/AllUser`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch users" };
  }
};

export const blockUser = async (id, days) => {
  try {
    const response = await axios.put(`${API_URL}/auth/block-user/${id}`, { days });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to block user" };
  }
};

export const unblockUser = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/auth/unblock-user/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to unblock user" };
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/auth/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete user" };
  }
};

// ❗ แก้ endpoint ให้ถูก: PUT /auth/:id (ของเดิมเป็น /auth/update/:id)
export const updateUser = async (id, payload) => {
  try {
    const response = await axios.put(`${API_URL}/auth/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update user" };
  }
};

/* ===================== Staff ===================== */

export const getAllStaff = async () => {
  try {
    const response = await axios.get(`${API_URL}/staff`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch staff data" };
  }
};

export const createStaff = async (staffData) => {
  try {
    const response = await axios.post(`${API_URL}/staff`, staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create staff" };
  }
};

export const updateStaff = async (id, staffData) => {
  try {
    const response = await axios.put(`${API_URL}/staff/${id}`, staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update staff" };
  }
};

export const deleteStaff = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/staff/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete staff" };
  }
};

/* ===================== Equipment ===================== */

export const getAllEquipment = async () => {
  try {
    const response = await axios.get(`${API_URL}/equipments`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch equipment data" };
  }
};

export const createEquipment = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/equipments`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create equipment" };
  }
};

export const updateEquipment = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/equipments/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update equipment" };
  }
};

export const deleteEquipment = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/equipments/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete equipment" };
  }
};

/* ===================== Stadium ===================== */

export const getAllStadiums = async () => {
  try {
    const response = await axios.get(`${API_URL}/stadiums`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch stadium data" };
  }
};

export const createStadium = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/stadiums`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create stadium" };
  }
};

export const updateStadium = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/stadiums/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update stadium" };
  }
};

export const deleteStadium = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/stadiums/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete stadium" };
  }
};

// ✅ ดึงสนามตาม id (พร้อม buildingIds)
export const getStadiumById = async (stadiumId) => {
  try {
    if (!stadiumId) return null;
    const res = await axios.get(`${API_URL}/stadiums/${stadiumId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch stadium by id" };
  }
};


/* ===================== Bookings / Stats ===================== */

export const getAllBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch bookings" };
  }
};

export const confirmBooking = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/bookings/${id}/confirm`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to confirm booking" };
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/bookings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to cancel booking" };
  }
};

export const resetBookingStatus = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/bookings/${id}/reset`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to reset booking status" };
  }
};

export const getMonthlyBookingStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats/monthly`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch monthly booking stats" };
  }
};

export const getDailyBookingStats = async (month, year = new Date().getFullYear()) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats/daily`, {
      params: { month, year },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch daily booking stats" };
  }
};

// สร้างการจอง
export const createBooking = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/bookings`, payload);
    return res.data; // { success, message, data }
  } catch (error) {
    throw error.response?.data || { message: "สร้างการจองไม่สำเร็จ" };
  }
};

// โหลดการจองทั้งหมดของสนาม เพื่อนำไปกรองตามวันที่ในฝั่ง client
export const getStadiumBookings = async (stadiumId) => {
  try {
    if (!stadiumId) return [];
    const res = await axios.get(`${API_URL}/bookings`, { params: { stadiumId } });
    const raw = res.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => {
      const id = typeof item?.stadiumId === "object" ? item.stadiumId?._id : item?.stadiumId;
      return id?.toString() === stadiumId.toString();
    });
  } catch (error) {
    if (error?.response?.status === 404) return [];
    throw error.response?.data || { message: "โหลดข้อมูลการจองไม่สำเร็จ" };
  }
};

// โหลด “วันไม่ว่าง” (หรือให้ backend คืน reservedDates)
// GET /api/bookings/available-dates?stadiumId=...
export const getAvailableDates = async (stadiumId, year, month) => {
  try {
    const res = await axios.get(`${API_URL}/bookings/available-dates`, {
      params: { stadiumId, year, month },
    });
    return res.data; // { success: true, reservedDates: ["2025-09-10", ...] }
  } catch (error) {
    throw error.response?.data || { message: "โหลดข้อมูลวันที่ไม่สำเร็จ" };
  }
};

// ประวัติการจองของผู้ใช้ (ให้ฝั่ง user เห็นภาพสนามด้วย)
export const getUserBookings = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user bookings" };
  }
};

// ประวัติการจองที่คืนอุปกรณ์สำเร็จ
export const getReturnedBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings/history/returned`);
    return response.data;
  } catch (error) {
    console.error("Error fetching returned bookings:", error);
    return [];
  }
};
