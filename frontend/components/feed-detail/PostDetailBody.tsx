'use client';

import { useState } from 'react';

type Props = {
  title: string;
  authorLabel: string;
  createdDateLabel: string;

  categoryLabel?: string;
  regionLabel?: string;

  content: string;

  isOwner: boolean;
  isLiked: boolean;
  isSubscribed: boolean;

  onLike: () => void;
  onShare: () => void;
  onSubscribe: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function PostDetailBody({
  title,
  authorLabel,
  createdDateLabel,
  categoryLabel,
  regionLabel,
  content,
  isOwner,
  isLiked,
  isSubscribed,
  onLike,
  onShare,
  onSubscribe,
  onEdit,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  /* 🔥 cursor-pointer ADD */
  const base =
    "flex items-center gap-2 h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors duration-150 cursor-pointer";

  const gray =
    "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]";

  const black =
    "bg-black text-white hover:opacity-90";

  const danger =
    "bg-[#ff4d4f] text-white hover:opacity-90";

  return (
    <div className="mt-[4] flex flex-col gap-[4] pl-[10px]">

      {/* 제목 */}
      <div className="text-[24px] font-extrabold leading-tight text-[#111]">
        {title}
      </div>

      {/* 작성자 + 등록일 + 카테고리 + 지역 */}
      <div className="text-[13px] text-[#777]">
        {authorLabel}
        {createdDateLabel && ` · ${createdDateLabel}`}
        {categoryLabel && ` · ${categoryLabel}`}
        {regionLabel && ` · ${regionLabel}`}
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-wrap items-center gap-[8] pt-[8]">
        <button onClick={onLike} className={`${base} ${gray}`}>
          👍 {isLiked ? "좋아요 취소" : "좋아요"}
        </button>

        <button onClick={onShare} className={`${base} ${gray}`}>
          🔄 공유
        </button>

        {!isOwner && (
          <button
            onClick={onSubscribe}
            className={`${base} ${
              isSubscribed ? black : gray
            }`}
          >
            {isSubscribed ? "구독중" : "구독"}
          </button>
        )}

        {isOwner && (
          <>
            <button onClick={onEdit} className={`${base} ${gray}`}>
              수정
            </button>

            <button onClick={onDelete} className={`${base} ${danger}`}>
              삭제
            </button>
          </>
        )}
      </div>

      {/* 콘텐츠 카드 */}
      <div className="mt-[8] rounded-[24] bg-[#f5f5f5] p-[20]">
        <div
          onClick={() => setExpanded(prev => !prev)}
          className="cursor-pointer"
        >
          <div
            className={`whitespace-pre-wrap text-[14px] leading-[1.7] ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            {content}
          </div>

          <div className="mt-[3] text-[14px] font-[medium] text-[#333]">
            {expanded ? '접기' : '더보기'}
          </div>
        </div>
      </div>

    </div>
  );
}