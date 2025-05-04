import React from 'react'

export const Google: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g filter="url(#filter0_d)">
        <path
          d="M20.64 12.2045C20.64 11.5645 20.5827 10.9445 20.4764 10.3445H12V13.8745H16.8436C16.635 14.9845 15.9009 15.9245 14.7955 16.5645V18.8195H17.7518C19.4582 17.2545 20.64 14.9445 20.64 12.2045Z"
          fill="url(#paint0_linear)"
        />
        <path
          d="M12 21C14.43 21 16.4673 20.1941 17.7518 18.8195L14.7955 16.5645C13.9618 17.1014 13.0436 17.4205 12 17.4205C9.65591 17.4205 7.67182 15.8373 6.96409 13.71H3.90455V16.0418C5.18045 18.9832 8.34818 21 12 21Z"
          fill="url(#paint1_linear)"
        />
        <path
          d="M6.96409 13.71C6.78409 13.17 6.68182 12.5932 6.68182 12C6.68182 11.4068 6.78409 10.83 6.96409 10.29V7.95818H3.90455C3.32727 9.17318 3 10.5477 3 12C3 13.4523 3.32727 14.8268 3.90455 16.0418L6.96409 13.71Z"
          fill="url(#paint2_linear)"
        />
        <path
          d="M12 6.57955C13.3214 6.57955 14.5077 7.03364 15.4405 7.92545L18.0218 5.34409C16.4632 3.89182 14.4259 3 12 3C8.34818 3 5.18045 5.01682 3.90455 7.95818L6.96409 10.29C7.67182 8.16273 9.65591 6.57955 12 6.57955Z"
          fill="url(#paint3_linear)"
        />
      </g>
      <defs>
        <filter id="filter0_d" x="0" y="0" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <linearGradient id="paint0_linear" x1="12" y1="10.3445" x2="20.64" y2="18.8195" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4"/>
          <stop offset="1" stopColor="#2AA4F4"/>
        </linearGradient>
        <linearGradient id="paint1_linear" x1="3.90455" y1="16.0418" x2="17.7518" y2="18.8195" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34A853"/>
          <stop offset="1" stopColor="#2ECC71"/>
        </linearGradient>
        <linearGradient id="paint2_linear" x1="3" y1="12" x2="6.96409" y2="13.71" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBC05"/>
          <stop offset="1" stopColor="#F1C40F"/>
        </linearGradient>
        <linearGradient id="paint3_linear" x1="3.90455" y1="7.95818" x2="18.0218" y2="5.34409" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EA4335"/>
          <stop offset="1" stopColor="#E74C3C"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

