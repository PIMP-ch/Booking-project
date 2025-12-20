// 'use client'
// import React from 'react';
// import Image from "next/image";
// import LogoIcon from '/public/images/logos/logo-icon.svg'
// import Link from 'next/link';
// const Logo = () => {
//   return (
//    <Link href={'/'}>
//       <Image src={LogoIcon} alt="logo" />
//     </Link>
//   )
// }

// export default Logo

'use client'
import React from 'react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href={'/'} className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
      ADMIN PANEL
    </Link>
  );
}

export default Logo;
