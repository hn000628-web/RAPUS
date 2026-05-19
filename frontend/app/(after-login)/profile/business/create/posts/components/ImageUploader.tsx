'use client';

import { useMemo, useEffect, useRef } from 'react';

const MAX_IMAGES = 30;

type PreviewImage = {
  id?: number;
  src: string;
};

type Props = {
  images?: File[];
  setImages?: React.Dispatch<
    React.SetStateAction<File[]>
  >;

  previewImages?: PreviewImage[];

  onAdd?: (files: File[]) => void;
  onRemove?: (index: number) => void;

  loading: boolean;
};

export default function ImageUploader({
  images = [],
  setImages,
  previewImages,
  onAdd,
  onRemove,
  loading,
}: Props) {

  const isEditMode =
    Boolean(previewImages && onAdd && onRemove);

  const imageCount =
    isEditMode
      ? previewImages!.length
      : images.length;

  const objectUrls =
    useRef<string[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const renderImages = useMemo(() => {

    if (isEditMode) {
      return previewImages!.map(
        img => img.src
      );
    }

    objectUrls.current =
      images.map(file =>
        URL.createObjectURL(file)
      );

    return objectUrls.current;

  }, [images, previewImages, isEditMode]);

  useEffect(() => {

    return () => {

      objectUrls.current.forEach(url =>
        URL.revokeObjectURL(url)
      );

    };

  }, []);

  const handleChange =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {

      const files =
        e.target.files;

      if (!files) return;

      const remaining =
        MAX_IMAGES - imageCount;

      if (remaining <= 0) return;

      const fileArray =
        Array
          .from(files)
          .slice(0, remaining);

      if (isEditMode) {

        onAdd?.(fileArray);

      } else {

        setImages?.(prev => [
          ...prev,
          ...fileArray,
        ]);

      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    };

  const removeImage =
    (index: number) => {

      if (isEditMode) {

        onRemove?.(index);

      } else {

        setImages?.(
          prev =>
            prev.filter(
              (_, i) => i !== index
            )
        );

      }

    };

  const removeAll = () => {

    if (isEditMode) {

      for (
        let i = imageCount - 1;
        i >= 0;
        i--
      ) {

        onRemove?.(i);

      }

    } else {

      setImages?.([]);

    }

  };

  return (

    <div
      style={{ marginBottom: 10 }}
    >

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          선택된 사진 {imageCount}장
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >

          <label
            style={{
              padding: '6px 14px',
              background:
                imageCount >=
                  MAX_IMAGES ||
                loading
                  ? '#ccc'
                  : '#1877f2',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor:
                imageCount >=
                  MAX_IMAGES ||
                loading
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >

            + 추가

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              disabled={
                imageCount >=
                  MAX_IMAGES ||
                loading
              }
              onChange={
                handleChange
              }
              style={{
                display: 'none'
              }}
            />

          </label>

          {imageCount > 0 && (

            <button
              type="button"
              onClick={removeAll}
              style={{
                padding:
                  '6px 14px',
                background:
                  '#ff4d4f',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor:
                  'pointer',
              }}
            >
              전체삭제
            </button>

          )}

        </div>

      </div>

      <div
        style={{
          minHeight: 100,
          border:
            '2px dashed #ccc',
          borderRadius: 12,
          padding: 18,
          background: '#fafafa',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          justifyContent:
            imageCount === 0
              ? 'center'
              : 'flex-start',
          alignItems:
            imageCount === 0
              ? 'center'
              : 'flex-start',
        }}
      >

        {imageCount === 0 && (

          <label
            style={{
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              width: '100%',
              minHeight: 100,
              border:
                '1px solid #ccc',
              borderRadius: 12,
              background:
                '#fafafa',
              cursor:
                'pointer',
              color: '#999',
              fontSize: 13,
              fontWeight: 500,
            }}
          >

            사진 추가하기

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              disabled={
                imageCount >=
                  MAX_IMAGES ||
                loading
              }
              onChange={
                handleChange
              }
              style={{
                display: 'none'
              }}
            />

          </label>

        )}

        {renderImages.map(
          (src, i) => (

            <div
              key={`${src}-${i}`}
              style={{
                position:
                  'relative',
                width: 90,
                height: 90,
                borderRadius: 12,
                overflow:
                  'hidden',
                border:
                  '1px solid #ddd',
                background:
                  '#fff',
              }}
            >

              <img
                src={src}
                alt=""
                style={{
                  width:
                    '100%',
                  height:
                    '100%',
                  objectFit:
                    'cover',
                }}
              />

              <button
                onClick={() =>
                  removeImage(i)
                }
                style={{
                  position:
                    'absolute',
                  top: 6,
                  right: 6,
                  width: 20,
                  height: 20,
                  borderRadius:
                    '50%',
                  border:
                    'none',
                  background:
                    'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: 11,
                  cursor:
                    'pointer',
                }}
              >
                ✕
              </button>

            </div>

          )
        )}

      </div>

    </div>

  );

}