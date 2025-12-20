import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5008/api";

// ✅ ฟังก์ชันสำหรับการล็อกอิน
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/staff/login`, { email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "An error occurred" };
    }
};

// ✅ ดึงข้อมูลพนักงานทั้งหมด
export const getAllStaff = async () => {
    try {
        const response = await axios.get(`${API_URL}/staff`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch staff data" };
    }
};

// ✅ เพิ่มพนักงานใหม่
export const createStaff = async (staffData) => {
    try {
        const response = await axios.post(`${API_URL}/staff`, staffData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to create staff" };
    }
};

// ✅ แก้ไขข้อมูลพนักงาน
export const updateStaff = async (id, staffData) => {
    try {
        const response = await axios.put(`${API_URL}/staff/${id}`, staffData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to update staff" };
    }
};

// ✅ ลบพนักงาน
export const deleteStaff = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/staff/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete staff" };
    }
};

// ✅ ฟังก์ชันสำหรับ Equipment

// ดึงข้อมูลอุปกรณ์ทั้งหมด
export const getAllEquipment = async () => {
    try {
        const response = await axios.get(`${API_URL}/equipments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch equipment data" };
    }
};

// เพิ่มอุปกรณ์ใหม่
export const createEquipment = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/equipments`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to create equipment" };
    }
};

// แก้ไขข้อมูลอุปกรณ์
export const updateEquipment = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/equipments/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to update equipment" };
    }
};

// ลบอุปกรณ์
export const deleteEquipment = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/equipments/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete equipment" };
    }
};

// อัปโหลดรูปอุปกรณ์
export const uploadEquipmentImage = async (id, file) => {
    try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await axios.post(`${API_URL}/equipments/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to upload equipment image" };
    }
};

// ลบรูปอุปกรณ์
export const deleteEquipmentImage = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/equipments/${id}/image`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete equipment image" };
    }
};

// ✅ ฟังก์ชันสำหรับ Stadium

// ดึงข้อมูลสนามทั้งหมด
export const getAllStadiums = async () => {
    try {
        const response = await axios.get(`${API_URL}/stadiums`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch stadium data" };
    }
};

// เพิ่มสนามกีฬาใหม่
export const createStadium = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/stadiums`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to create stadium" };
    }
};

// แก้ไขข้อมูลสนามกีฬา
export const updateStadium = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/stadiums/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to update stadium" };
    }
};

// ลบสนามกีฬา
export const deleteStadium = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/stadiums/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete stadium" };
    }
};

// อัปโหลดรูปสนามกีฬา
export const uploadStadiumImage = async (id, file) => {
    try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await axios.post(`${API_URL}/stadiums/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to upload stadium image" };
    }
};

// ลบรูปสนามกีฬา
export const deleteStadiumImage = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/stadiums/${id}/image`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete stadium image" };
    }
};


export const getAllUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/AllUser`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch users" };
    }
};

// ✅ บล็อกผู้ใช้ตามระยะเวลาที่กำหนด (15, 30, 60 วัน)
export const blockUser = async (id, days) => {
    try {
        const response = await axios.put(`${API_URL}/auth/block-user/${id}`, { days });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to block user" };
    }
};

// ✅ ปลดบล็อกผู้ใช้
export const unblockUser = async (id) => {
    try {
        const response = await axios.put(`${API_URL}/auth/unblock-user/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to unblock user" };
    }
};

// ✅ ลบผู้ใช้
export const deleteUser = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/auth/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete user" };
    }
};




// ✅ ดึงประวัติการจองทั้งหมด
export const getAllBookings = async () => {
    try {
        const response = await axios.get(`${API_URL}/bookings`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch bookings" };
    }
};

// ✅ ยืนยันการจอง
export const confirmBooking = async (id) => {
    try {
        const response = await axios.put(`${API_URL}/bookings/${id}/confirm`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to confirm booking" };
    }
};

// ✅ ยกเลิกการจอง
export const cancelBooking = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/bookings/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to cancel booking" };
    }
};


// Fetch monthly booking stats
export const getMonthlyBookingStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/bookings/stats/monthly`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch monthly booking stats" };
    }
};

//สถิติการจองรายวัน (ตามเดือน/ปี)
export const getDailyBookingStats = async (month, year = new Date().getFullYear()) => {
    try {
        const response = await axios.get(`${API_URL}/bookings/stats/daily`, {
            params: {month, year},
        });
        return response.data;
    } catch  (error) {
        throw error.response?.data || {message: "Failed to fetch daily booking stats"};
    }
};

// ✅ ดึงจำนวนผู้ใช้ทั้งหมด
export const getTotalUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats/users`);
        return response.data.totalUsers; // Return จำนวนผู้ใช้ทั้งหมด
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch total users" };
    }
};

// ✅ Fetch count of pending bookings
export const getPendingBookingsCount = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats/bookings/pending`);
        return response.data.pendingBookings; // Assumes the response includes a 'pendingBookings' count
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch pending bookings count" };
    }
};

// ✅ Reset Booking Status API
export const resetBookingStatus = async (id) => {
    try {
        const response = await axios.put(`${API_URL}/bookings/${id}/reset`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to reset booking status" };
    }
};

// ✅ ดึงประวัติการจองที่มีสถานะ "Return Success"
export const getReturnedBookings = async () => {
    try {
        const response = await axios.get(`${API_URL}/bookings/history/returned`);
        return response.data;
    } catch (error) {
        console.error("Error fetching returned bookings:", error);
        return [];
    }
};
