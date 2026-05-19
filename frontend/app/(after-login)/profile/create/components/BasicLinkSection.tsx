'use client';

import type { CSSProperties } from 'react';
import type { ProfileBlock } from '../../../settings/profile/types';

type Props = {
  links: ProfileBlock[];
  setLinks: React.Dispatch<React.SetStateAction<ProfileBlock[]>>;
};

export default function BasicLinkSection({
  links,
  setLinks,
}: Props) {

  const INPUT_HEIGHT = 48;
  const RADIUS = 12;
  const BORDER = '1px solid #e5e7eb';

  const sectionStyle: CSSProperties = {
    marginBottom: 24,
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

  // LINK만 필터
  const linkBlocks = links.filter(b => b.type === 'LINK');

  const updateLink = (
    id: number,
    field: 'title' | 'url' | 'description',
    value: string,
  ) => {
    setLinks(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, [field]: value }
          : b,
      ),
    );
  };

  const removeLink = (id: number) => {
    setLinks(prev =>
      prev.filter(b => b.id !== id),
    );
  };

  return (
    <div style={sectionStyle}>

      {linkBlocks.map(link => (
        <div
          key={link.id}
          style={{
            marginBottom: 16,
            padding: 16,
            border: BORDER,
            borderRadius: RADIUS,
          }}
        >
          <input
            type="text"
            placeholder="제목 입력"
            value={link.title}
            onChange={(e) =>
              updateLink(
                link.id,
                'title',
                e.target.value,
              )
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="URL 입력"
            value={link.url ?? ''}
            onChange={(e) =>
              updateLink(
                link.id,
                'url',
                e.target.value,
              )
            }
            style={{
              ...inputStyle,
              marginTop: 12,
            }}
          />

          <textarea
            placeholder="설명 입력"
            value={link.description ?? ''}
            onChange={(e) =>
              updateLink(
                link.id,
                'description',
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
              removeLink(link.id)
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
  );
}