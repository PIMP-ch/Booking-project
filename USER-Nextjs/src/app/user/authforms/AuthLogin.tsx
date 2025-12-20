"use client";

import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // เปลี่ยนเป็น next/navigation (ใช้กับ App Router)
import React, { useState } from "react";
import { loginUser } from "@/utils/api"; // Import API function

const AuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter(); // ประกาศ useRouter ใน Component

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null); // Clear previous error

      // Call API to login
      const response = await loginUser(email, password);

      // console.log("Login Successful:", response);

      // Access fullname from the response and save it to localStorage
      if (response.staff?.fullname) {
        localStorage.setItem("staffName", response.staff.fullname);
      }

      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Failed:", err);
      setError(err.message || "An error occurred during login."); // Show error
    }
  };


  return (
    <form className="font-kanit" onSubmit={handleLogin}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="email" value="Email" />
        </div>
        <TextInput
          id="email"
          type="email"
          sizing="md"
          className="form-control"
          placeholder="กรอก email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Bind email state
        />
      </div>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="password" value="Password" />
        </div>
        <TextInput
          id="password"
          type="password"
          sizing="md"
          className="form-control"
          placeholder="กรอก รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Bind password state
        />
      </div>
      {error && <p className="text-red-500 text-sm mb-4 ">{error}</p>} {/* Show error */}
      <Button type="submit" color="primary" className="w-full font-kanit">
        เข้าสู่ระบบ
      </Button>
    </form>
  );
};

export default AuthLogin;
