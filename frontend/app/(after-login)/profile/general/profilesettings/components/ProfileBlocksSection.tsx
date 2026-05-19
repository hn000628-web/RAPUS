'use client'

/* ==================================================
SECTION 01 IMPORT
================================================== */

import { useState } from 'react'

/* ==================================================
SECTION 02 TYPE (DB SYNC)
================================================== */

type BlockType = 'TEXT' | 'LINK'

export type Block = {
  id: number
  type: BlockType
  title: string
  content?: string
  url?: string
  description?: string
}

type Props = {
  blocks: Block[]
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
  displayName: string
  channelId: string
  setChannelId: React.Dispatch<React.SetStateAction<string>>
  slug: string
  setSlug: React.Dispatch<React.SetStateAction<string>>
  regionName: string
  moveChannelManage: () => void
}

/* ==================================================
SECTION 03 COMPONENT
================================================== */

export default function ProfileBlocksSection({
  blocks,
  setBlocks,
  displayName,
  channelId,
  setChannelId,
  slug,
  setSlug,
  regionName,
  moveChannelManage
}: Props) {

/* ==================================================
SECTION 04 STATE
================================================== */

  const [focus, setFocus] = useState<string | null>(null)

/* ==================================================
SECTION 05 CONSTANT (LIMIT)
================================================== */

  const TITLE_LIMIT = 60
  const TEXT_LIMIT = 300
  const LINK_DESC_LIMIT = 200

/* ==================================================
SECTION 06 EVENT
================================================== */

  const addBlock = (type: BlockType) => {
    if (blocks.length >= 10) {
      alert('최대 10개')
      return
    }

    setBlocks([
      ...blocks,
      {
        id: Date.now(),
        type,
        title: '',
        content: '',
        url: '',
        description: ''
      }
    ])
  }

  const removeBlock = (id: number) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const updateBlock = (
    id: number,
    field: keyof Block,
    value: string
  ) => {
    setBlocks(
      blocks.map(b =>
        b.id === id ? { ...b, [field]: value } : b
      )
    )
  }

/* ==================================================
SECTION 07 UI
================================================== */

  return (

    <div style={{ marginTop: 8 }}>

      <div style={{ fontSize: 14, fontWeight: 600 }}>
        추가 정보
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 4
      }}>

        {blocks.map(block => (

          <div
            key={block.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              background: 'white'
            }}
          >

            <div style={{
              fontSize: 12,
              color: '#6b7280',
              marginBottom: 8
            }}>
              {block.type === 'TEXT' ? '텍스트' : '링크'}
            </div>

            <input
              value={block.title}
              maxLength={TITLE_LIMIT}
              onChange={e =>
                updateBlock(block.id, 'title', e.target.value)
              }
              onFocus={() =>
                setFocus(`${block.id}-title`)
              }
              onBlur={() => setFocus(null)}
              placeholder='제목'
              style={{
                width: '100%',
                height: 56,
                padding: '14px 16px',
                borderRadius: 12,
                border:
                  focus === `${block.id}-title`
                    ? '1px solid #2563eb'
                    : '1px solid #d1d5db',
                fontSize: 14,
                marginBottom: 6,
                outline: 'none',
                transition: '0.15s',
                boxSizing: 'border-box'
              }}
            />

            <div style={{
              fontSize: 11,
              color: '#9ca3af',
              textAlign: 'right',
              marginBottom: 10
            }}>
              {block.title.length}/{TITLE_LIMIT}
            </div>

            {block.type === 'LINK' && (
              <>
                <input
                  value={block.url || ''}
                  onChange={e =>
                    updateBlock(block.id, 'url', e.target.value)
                  }
                  onFocus={() =>
                    setFocus(`${block.id}-url`)
                  }
                  onBlur={() => setFocus(null)}
                  placeholder='URL'
                  style={{
                    width: '100%',
                    height: 56,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border:
                      focus === `${block.id}-url`
                        ? '1px solid #2563eb'
                        : '1px solid #d1d5db',
                    fontSize: 14,
                    marginBottom: 10,
                    outline: 'none',
                    transition: '0.15s',
                    boxSizing: 'border-box'
                  }}
                />

                <textarea
                  value={block.description || ''}
                  maxLength={LINK_DESC_LIMIT}
                  onChange={e =>
                    updateBlock(block.id, 'description', e.target.value)
                  }
                  placeholder='내용 (선택)'
                  style={{
                    width: '100%',
                    minHeight: 120,
                    maxHeight: 260,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    lineHeight: 1.6
                  }}
                />

                <div style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  textAlign: 'right',
                  marginTop: 4
                }}>
                  {(block.description || '').length}/{LINK_DESC_LIMIT}
                </div>
              </>
            )}

            {block.type === 'TEXT' && (
              <>
                <textarea
                  value={block.content || ''}
                  maxLength={TEXT_LIMIT}
                  onChange={e =>
                    updateBlock(block.id, 'content', e.target.value)
                  }
                  onFocus={() =>
                    setFocus(`${block.id}-content`)
                  }
                  onBlur={() => setFocus(null)}
                  placeholder='내용'
                  style={{
                    width: '100%',
                    minHeight: 120,
                    maxHeight: 260,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border:
                      focus === `${block.id}-content`
                        ? '1px solid #2563eb'
                        : '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                    transition: '0.15s',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    lineHeight: 1.6
                  }}
                />

                <div style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  textAlign: 'right',
                  marginTop: 4
                }}>
                  {(block.content || '').length}/{TEXT_LIMIT}
                </div>
              </>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 10
            }}>
              <button
                onClick={() => removeBlock(block.id)}
                style={{
                  fontSize: 13,
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                삭제
              </button>
            </div>

          </div>

        ))}

      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 16
      }}>

        <button
          onClick={() => addBlock('TEXT')}
          style={btnStyle}
        >
          + 텍스트
        </button>

        <button
          onClick={() => addBlock('LINK')}
          style={btnStyle}
        >
          + 링크
        </button>

      </div>

      <div style={{
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'right'
      }}>
        {blocks.length}/10
      </div>

    </div>

  )
}

/* ==================================================
STYLE
================================================== */

const btnStyle: React.CSSProperties = {
  flex: 1,
  height: 56,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500
}