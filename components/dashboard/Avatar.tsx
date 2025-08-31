import React from 'react'

const Avatar = ({ name, onClick, bgClass }: { name?: string; onClick?: () => void; bgClass?: string }) => (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer ${bgClass ?? 'bg-gray-400'}`}
      onClick={onClick}
    >
      {name ? name.split(' ').map(n => n[0]).join('') : 'U'}
    </div>
);

export default Avatar
