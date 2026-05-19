type PostStatus = 'ACTIVE' | 'DRAFT';

type Props = {
  status: PostStatus;
  setStatus: (v: PostStatus) => void;
  loading: boolean;
};

export default function StatusToggle({
  status,
  setStatus,
  loading,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#f1f3f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? 'none' : 'auto',
      }}
    >
      {(['ACTIVE', 'DRAFT'] as PostStatus[]).map((v) => {
        const active = status === v;

        return (
          <div
            key={v}
            onClick={() => setStatus(v)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 0',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? '#1877f2' : 'transparent',
              color: active ? '#fff' : '#555',
              transition: 'all 0.2s ease',
            }}
          >
            {v === 'ACTIVE' ? '공개' : '작성중'}
          </div>
        );
      })}
    </div>
  );
}
