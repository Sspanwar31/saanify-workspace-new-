'use client';

export default function FloatingTempleLamps() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '220px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120px',
        height: '120px',
        background: 'yellow',
        borderRadius: '50%',
        zIndex: 9999,
      }}
    />
  );
}
