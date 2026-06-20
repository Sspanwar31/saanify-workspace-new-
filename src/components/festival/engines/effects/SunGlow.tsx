'use client';

export default function SunGlow() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        height: '300px',
        background: 'red',
        zIndex: 9999,
      }}
    />
  );
}
