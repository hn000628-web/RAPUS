'use client';

import { useState } from 'react';

type Priority = 'low' | 'normal' | 'high' | 'top';
type RegionMode = 'strict' | 'near' | 'global';

type FeedRule = {
  enabled: boolean;
  priority: Priority;
  regionMode: RegionMode;
  keywordRequired: boolean;
};

export default function AdminFeedsPage() {
  const [saved, setSaved] = useState(false);

  const [rules, setRules] = useState<Record<string, FeedRule>>({
    free_profile: {
      enabled: false,
      priority: 'low',
      regionMode: 'near',
      keywordRequired: false,
    },
    paid_profile: {
      enabled: false,
      priority: 'low',
      regionMode: 'global',
      keywordRequired: false,
    },
    free_post: {
      enabled: true,
      priority: 'normal',
      regionMode: 'near',
      keywordRequired: true,
    },
    paid_post: {
      enabled: false,
      priority: 'low',
      regionMode: 'global',
      keywordRequired: true,
    },
  });

  const updateRule = (key: string, next: Partial<FeedRule>) => {
    setSaved(false);
    setRules((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...next },
    }));
  };

  const handleSave = () => {
    const policy = {
      scope: 'home',
      rules,
    };

    console.log('저장될 피드 정책', policy);
    setSaved(true);
    alert('피드 노출 설정이 저장되었습니다.\n적용이 시작됩니다.');
  };

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
        피드 노출 설정
      </h1>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: '#f5f6f7', textAlign: 'left' }}>
            <Th>구분</Th>
            <Th>설명</Th>
            <Th>홈 노출</Th>
            <Th>우선순위</Th>
            <Th>지역 기준</Th>
            <Th>키워드 필요</Th>
          </tr>
        </thead>

        <tbody>
          <SettingRow
            label="무료 프로필"
            desc="일반 사용자 프로필"
            rule={rules.free_profile}
            onChange={(v) => updateRule('free_profile', v)}
          />
          <SettingRow
            label="유료 프로필"
            desc="구독 / 비즈니스 프로필"
            rule={rules.paid_profile}
            onChange={(v) => updateRule('paid_profile', v)}
          />
          <SettingRow
            label="무료 게시물"
            desc="일반 사용자 게시물"
            rule={rules.free_post}
            onChange={(v) => updateRule('free_post', v)}
          />
          <SettingRow
            label="유료 게시물"
            desc="광고 / 스폰서 게시물"
            rule={rules.paid_post}
            onChange={(v) => updateRule('paid_post', v)}
          />
        </tbody>
      </table>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ fontSize: 12, color: '#65676b', margin: 0 }}>
          * 피드 노출 설정은 홈 피드 구성에만 적용됩니다.
        </p>

        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: saved ? '#4caf50' : '#1877f2',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saved ? '적용 시작' : '저장'}
        </button>
      </div>
    </div>
  );
}

/* ---------- UI Parts ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '12px',
        borderBottom: '1px solid #eee',
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function SettingRow({
  label,
  desc,
  rule,
  onChange,
}: {
  label: string;
  desc: string;
  rule: FeedRule;
  onChange: (v: Partial<FeedRule>) => void;
}) {
  return (
    <tr>
      <Td>{label}</Td>
      <Td style={{ color: '#65676b' }}>{desc}</Td>

      <Td>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
      </Td>

      <Td>
        <select
          value={rule.priority}
          onChange={(e) =>
            onChange({ priority: e.target.value as Priority })
          }
        >
          <option value="low">낮음</option>
          <option value="normal">보통</option>
          <option value="high">높음</option>
          <option value="top">최우선</option>
        </select>
      </Td>

      <Td>
        <select
          value={rule.regionMode}
          onChange={(e) =>
            onChange({ regionMode: e.target.value as RegionMode })
          }
        >
          <option value="strict">완전 일치</option>
          <option value="near">인접 지역</option>
          <option value="global">전국</option>
        </select>
      </Td>

      <Td>
        <input
          type="checkbox"
          checked={rule.keywordRequired}
          onChange={(e) =>
            onChange({ keywordRequired: e.target.checked })
          }
        />
      </Td>
    </tr>
  );
}
