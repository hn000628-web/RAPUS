'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { ProfileBlock } from '../../../settings/profile/types';

type Props = {
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  regionName: string | null;

  blocks: ProfileBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<ProfileBlock[]>>;
};

export default function BasicInfoSection({
  displayName,
  setDisplayName,
  bio,
  setBio,
  regionName,
  blocks,
  setBlocks,
}: Props) {

  const router = useRouter();

  const INPUT_HEIGHT = 48;
  const RADIUS = 12;
  const BORDER = '1px solid #e5e7eb';

  const sectionStyle: CSSProperties = {
    marginBottom: 24,
  };

  const labelStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    height: INPUT_HEIGHT,
    padding: '0 16px',
    marginTop: 8,
    borderRadius: RADIUS,
    border: BORDER,
    boxSizing: 'border-box',
    fontSize: 14,
    outline: 'none',
  };

  const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 80,
    padding: 16,
    marginTop: 8,
    borderRadius: RADIUS,
    border: BORDER,
    boxSizing: 'border-box',
    fontSize: 14,
    resize: 'none',
    outline: 'none',
  };

  const textBlocks = blocks.filter(b => b.type === 'TEXT');

  const updateSection = (
    id: number,
    field: 'title' | 'content',
    value: string,
  ) => {
    setBlocks(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, [field]: value }
          : b,
      ),
    );
  };

  const removeSection = (id: number) => {
    setBlocks(prev =>
      prev.filter(b => b.id !== id),
    );
  };

  return (
    <>
      <div style={sectionStyle}>
        <label style={labelStyle}>닉네임</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) =>
            setDisplayName(e.target.value)
          }
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>지역설정</label>
        <div style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{regionName ?? '지역 미설정'}</span>
          <button
            type="button"
            onClick={() =>
              router.push('/settings/region')
            }
            style={{
              border: 'none',
              background: 'transparent',
              color: '#1877f2',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            지역설정
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>소개</label>
        <textarea
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          style={textareaStyle}
        />
      </div>

      <div style={sectionStyle}>
        {textBlocks.map(section => (
          <div
            key={section.id}
            style={{
              marginTop: 16,
              padding: 16,
              border: BORDER,
              borderRadius: RADIUS,
            }}
          >
            <input
              type="text"
              placeholder="제목 입력"
              value={section.title}
              onChange={(e) =>
                updateSection(
                  section.id,
                  'title',
                  e.target.value,
                )
              }
              style={inputStyle}
            />

            <textarea
              placeholder="내용 입력"
              value={section.content ?? ''}
              onChange={(e) =>
                updateSection(
                  section.id,
                  'content',
                  e.target.value,
                )
              }
              style={{
                ...textareaStyle,
                marginTop: 12,
              }}
            />

            <button
              type="button"
              onClick={() =>
                removeSection(section.id)
              }
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </>
  );
}