import { AppProps } from "next/app"; // ✅ นำเข้า Type AppProps
import "@/css/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function MyApp({ Component, pageProps }: AppProps) { // ✅ ใช้ Type AppProps
    return (
        <>
            <ToastContainer
                position="top-right"      // ตำแหน่งด้านขวาบน
                autoClose={3000}          // Toast หายไปอัตโนมัติใน 3 วินาที
                hideProgressBar={false}   // แสดง Progress Bar
                newestOnTop={true}        // Toast ล่าสุดอยู่บนสุด
                closeOnClick              // คลิกเพื่อปิดได้
                rtl={false}               // รองรับภาษาไทย (LTR)
                pauseOnHover              // หยุดอัตโนมัติเมื่อ Hover
                draggable                 // ลาก Toast ได้
                theme="dark"              // ใช้ธีมมืด
            />
            <Component {...pageProps} />
        </>
    );
}
