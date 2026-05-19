'use client';

export default function SystemPage() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '16px',
      }}
    >
      {/* 언어 설정 */}
      <Section title="언어">
        <StaticRow label="표시 언어" value="한국어" />
      </Section>

      {/* 보안 설정 */}
      <Section title="보안">
        <ActionRow label="비밀번호 변경" />
      </Section>

      {/* 통신 제어 */}
      <Section title="통신 설정">
        <ToggleRow label="메시지 허용" />
        <ToggleRow label="보이스톡 허용" />
      </Section>

      {/* 외부 통신 */}
      <Section title="외부 접근 설정">
        <ToggleRow label="외부 메시지 허용" />
        <ToggleRow label="외부 보이스톡 허용" />
      </Section>

      {/* 안내 문구 */}
      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: '#777',
          lineHeight: 1.6,
        }}
      >
        외부 접근 코드 및 QR 코드는
        <strong> 계정 상태 페이지</strong>에서 관리됩니다.
      </p>
    </div>
  );
}

/* ---------- 공통 UI ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: '1px solid #e5e5e5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: '#fff',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <input type="checkbox" />
    </div>
  );
}

function StaticRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        color: '#333',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ActionRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 12, color: '#999' }}>변경 →</span>
    </div>
  );
}
