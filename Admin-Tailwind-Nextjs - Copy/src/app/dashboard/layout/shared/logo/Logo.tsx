'use client'
import React from 'react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href={'/'} className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
      Booking Management System
    </Link>
  );
}

export default Logo;
