"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { RegisterUser } from "@/utils/api"; // ฟังก์ชันที่เรารับ Object
import useAuth from "@/hooks/useAuth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BoxedRegister = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    userType: "student" as "student" | "staff",
    fieldOfStudy: "",
    year: "",
    department: "", // ใช้ใน UI สำหรับ Staff
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [showStep1Error, setShowStep1Error] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validatePhoneNumber = (phoneNumber: string) => /^[0-9]{10}$/.test(phoneNumber.trim());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    setShowStep1Error(true);
    const okFullname = !!formData.fullname.trim();
    const okEmail = !!formData.email.trim() && validateEmail(formData.email);
    const okPhone = !!formData.phoneNumber.trim() && validatePhoneNumber(formData.phoneNumber);

    if (!okFullname || !okEmail || !okPhone) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ตรวจสอบข้อมูล Step 2 ก่อนส่ง
    if (formData.userType === "student") {
      if (!formData.fieldOfStudy.trim() || !formData.year.trim()) {
        toast.error("❌ กรุณากรอกข้อมูลนักศึกษาให้ครบถ้วน");
        setLoading(false);
        return;
      }
    } else {
      if (!formData.department.trim()) {
        toast.error("❌ กรุณากรอกชื่อภาควิชา/หน่วยงาน");
        setLoading(false);
        return;
      }
    }

    try {
      // ✅ จุดที่แก้ไข: สร้าง Object ให้ตรงกับที่ RegisterUser ใน api.js คาดหวัง
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        userType: formData.userType, // ✅ ส่งค่า "student" หรือ "staff" ไปด้วย
        // ส่งค่าว่างไปในฟิลด์ที่ไม่ได้ใช้ เพื่อป้องกัน Backend Error
        fieldOfStudy: formData.userType === "student" ? formData.fieldOfStudy : formData.department,
        year: formData.userType === "student" ? formData.year : "Staff", 
        department: formData.userType === "staff" ? formData.department : "",
      };

      const response = await RegisterUser(payload);

      if (response && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        login(response.user);
        toast.success("✅ สมัครสมาชิกสำเร็จ!", { position: "top-center", autoClose: 2000 });

        setTimeout(() => {
          router.push("/home");
        }, 2000);
      }
    } catch (err: any) {
      // ดึงข้อความ error จาก Backend (ที่เซ็ตไว้ใน catch ของ api.js)
      const errorMsg = err.message || "เกิดข้อผิดพลาดจากระบบ";
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const step1FullnameError = showStep1Error && !formData.fullname.trim();
  const step1EmailError = showStep1Error && (!formData.email.trim() || !validateEmail(formData.email));
  const step1PhoneError = showStep1Error && (!formData.phoneNumber.trim() || !validatePhoneNumber(formData.phoneNumber));

  return (
    <div className="font-kanit relative h-screen flex items-end justify-center pb-10">
      <div className="absolute inset-0">
        <img
          src="/images/backgrounds/bg-football-stadium.png"
          alt="Stadium Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-white bg-black/60 p-8 rounded-lg shadow-2xl backdrop-blur-sm">
          <h2 className="text-white text-3xl mb-2 font-bold text-center">สมัครสมาชิก</h2>
          <p className="text-sm text-center text-gray-300 mb-6">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    placeholder="กรอกชื่อและนามสกุล"
                    className={`w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500 ${step1FullnameError ? "border-red-500" : "border-gray-300"}`}
                  />
                  {step1FullnameError && <p className="mt-1 text-xs text-red-400">✖ กรุณากรอกชื่อ-นามสกุล</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@mail.com"
                    className={`w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500 ${step1EmailError ? "border-red-500" : "border-gray-300"}`}
                  />
                  {step1EmailError && <p className="mt-1 text-xs text-red-400">✖ รูปแบบอีเมลไม่ถูกต้อง</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="08XXXXXXXX"
                    className={`w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500 ${step1PhoneError ? "border-red-500" : "border-gray-300"}`}
                  />
                  {step1PhoneError && <p className="mt-1 text-xs text-red-400">✖ กรุณากรอกเบอร์โทร 10 หลัก</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-orange-500 text-white py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition duration-300 shadow-lg"
                >
                  ถัดไป
                </button>

                <p className="text-center text-sm text-gray-300 mt-4">
                  มีบัญชีอยู่แล้ว? <Link href="/user/login" className="text-orange-400 hover:underline">เข้าสู่ระบบ</Link>
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm mb-1">ประเภทผู้ใช้</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="student">นักศึกษา</option>
                    <option value="staff">บุคลากร</option>
                  </select>
                </div>

                {formData.userType === "student" ? (
                  <>
                    <div>
                      <label className="block text-sm mb-1">สาขาวิชา</label>
                      <input
                        type="text"
                        name="fieldOfStudy"
                        value={formData.fieldOfStudy}
                        onChange={handleChange}
                        placeholder="ระบุสาขาวิชา"
                        className="w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">ปีที่ศึกษา</label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        placeholder="เช่น 1, 2, 3"
                        className="w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm mb-1">ภาควิชา / แผนก</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="ระบุชื่อหน่วยงาน"
                      className="w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="รหัสผ่าน 6 ตัวขึ้นไป"
                      className="w-full p-3 rounded bg-white border text-gray-800 focus:ring-2 focus:ring-orange-500 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-500 hover:text-orange-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setShowStep1Error(false); }}
                    className="w-1/2 bg-gray-600 text-white py-3 rounded-md font-semibold hover:bg-gray-700 transition"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 disabled:bg-orange-300 shadow-lg"
                  >
                    {loading ? "กำลังโหลด..." : "สมัครสมาชิก"}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BoxedRegister;