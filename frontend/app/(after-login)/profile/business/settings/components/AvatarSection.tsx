'use client';

import { useRouter } from 'next/navigation';

type Props = {
  imageUrl: string | null;
  editable?: boolean;
};

export default function AvatarSection({
  imageUrl,
  editable = false,
}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (!editable) return;
    router.push('/profile/business/settings/avatar');
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: -48,
        transform: 'translateX(-50%)',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: '#ddd',
        border: '4px solid #fff',
        boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        cursor: editable ? 'pointer' : 'default',
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="profile"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
}