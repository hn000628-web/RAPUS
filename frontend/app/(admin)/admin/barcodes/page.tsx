'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  createMasterBarcode,
  fetchMasterBarcodeSummary,
  fetchMasterBarcodesSearch,
  type CreateMasterBarcodeInput,
  type MasterBarcodeCsvUploadResponse,
  type MasterBarcodeSearchItem,
  type MasterBarcodeSearchResponse,
  type MasterBarcodeSummaryResponse,
  updateMasterBarcode,
  uploadMasterBarcodeCsv,
} from '@/lib/admin/masterBarcodesApi';
import { buildMediaUrl } from '@/lib/config';
import styles from './barcodes.module.css';

type UploadStatus = '대기' | '업로드 중' | '업로드 완료' | '업로드 실패';

type RegisterFormState = Omit<CreateMasterBarcodeInput, 'thumbnail'>;


const EMPTY_SUMMARY: MasterBarcodeSummaryResponse = {
  totalCount: 0,
  validCount: 0,
  duplicateSuspectCount: 0,
  errorCount: 0,
  unlinkedCount: 0,
};

const EMPTY_REGISTER_FORM: RegisterFormState = {
  gtin: '',
  productCategoryName: '',
  productNameKo: '',
  brandName: '',
  companyInfo: '',
  originInfo: '',
  packageInfo: '',
  specInfo: '',
  netWeight: '',
  productShape: '',
  productNumber: '',
};

const ALLOWED_UPLOAD_EXTENSIONS = ['csv', 'xlsx', 'xls'];

function getDisplayProductName(
  item: MasterBarcodeSearchItem & { normalizedProductName?: string | null },
): string {
  const productName =
    item.productNameKo?.trim() ||
    item.rawProductName?.trim() ||
    item.normalizedProductName?.trim();

  return productName || '상품명 미등록';
}

function getThumbnailLabel(item: MasterBarcodeSearchItem): string {
  const source =
    item.productNameKo ||
    item.rawProductName ||
    item.productCategoryName ||
    'GTIN';

  return source.trim().slice(0, 2);
}

function resolveBarcodeThumbnailSrc(
  item?: Pick<MasterBarcodeSearchItem, 'sourceThumbnailUrl'> | null,
): string {
  const rawUrl = item?.sourceThumbnailUrl?.trim();

  if (!rawUrl) {
    return '';
  }

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  return buildMediaUrl(rawUrl);
}

export default function AdminBarcodesPage() {
  const [summary, setSummary] =
    useState<MasterBarcodeSummaryResponse>(EMPTY_SUMMARY);

  const [searchInput, setSearchInput] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] =
    useState<MasterBarcodeSearchResponse | null>(null);
  const [cardThumbnailErrorIds, setCardThumbnailErrorIds] = useState<Set<number>>(
    () => new Set(),
  );

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('대기');
  const [uploadResult, setUploadResult] =
    useState<MasterBarcodeCsvUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState('');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedBarcodeRow, setSelectedBarcodeRow] =
    useState<MasterBarcodeSearchItem | null>(null);
  const [registerForm, setRegisterForm] =
    useState<RegisterFormState>(EMPTY_REGISTER_FORM);
  const [registerSaving, setRegisterSaving] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [isThumbnailLoadError, setIsThumbnailLoadError] = useState(false);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const loadSummary = async () => {
    try {
      const response = await fetchMasterBarcodeSummary();
      setSummary(response);
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  useEffect(() => {
    return () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  const clearThumbnailPreview = () => {
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }

    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setIsThumbnailLoadError(false);

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleBarcodeThumbnailChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setRegisterError('PNG, JPG, WEBP 이미지만 등록할 수 있습니다.');

      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }

      return;
    }

    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    currentObjectUrlRef.current = nextObjectUrl;
    setThumbnailFile(file);
    setThumbnailPreviewUrl(nextObjectUrl);
    setIsThumbnailLoadError(false);
    setRegisterError('');
  };

  const resetRegisterForm = () => {
    setRegisterForm(EMPTY_REGISTER_FORM);
    setRegisterSaving(false);
    setRegisterError('');
    clearThumbnailPreview();
  };

  const updateRegisterForm =
    (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setRegisterForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setRegisterError('');
    };

  const runSearch = async (queryRaw: string) => {
    const query = queryRaw.trim();
    if (!query) {
      setSearchError('검색어를 입력해 주세요.');
      setSearchResult(null);
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const response = await fetchMasterBarcodesSearch(query);
      setSearchInput(query);
      setSearchResult(response);
      setCardThumbnailErrorIds(new Set());
      setIsSearchModalOpen(false);

      if (response.totalCount === 0) {
        setSearchError('검색 결과가 없습니다.');
      }
    } catch {
      setSearchResult(null);
      setSearchError('검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const openSearchModal = () => {
    setSearchDraft(searchInput);
    setSearchError('');
    setIsSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension)) {
        setCsvFile(null);
        setUploadStatus('업로드 실패');
        setUploadResult(null);
        setUploadError('CSV 또는 Excel 파일만 업로드할 수 있습니다.');

        if (csvInputRef.current) {
          csvInputRef.current.value = '';
        }

        return;
      }
    }

    setCsvFile(file);
    setUploadStatus('대기');
    setUploadResult(null);
    setUploadError('');
  };

  const handleCsvCancel = () => {
    setCsvFile(null);
    setUploadStatus('대기');
    setUploadResult(null);
    setUploadError('');

    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!csvFile || uploadStatus === '업로드 중') {
      return;
    }

    setUploadStatus('업로드 중');
    setUploadResult(null);
    setUploadError('');

    try {
      const response = await uploadMasterBarcodeCsv(csvFile);
      setUploadResult(response);
      setUploadStatus('업로드 완료');
      await loadSummary();
    } catch {
      setUploadStatus('업로드 실패');
      setUploadError('파일 업로드에 실패했습니다.');
    }
  };

  const openCreateModal = () => {
    resetRegisterForm();
    setSelectedBarcodeRow(null);
    setModalMode('create');
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    resetRegisterForm();
    setSelectedBarcodeRow(null);
    setModalMode(null);
    setIsRegisterModalOpen(false);
  };

  const openEditModal = (item: MasterBarcodeSearchItem) => {
    const existingThumbnailSrc = resolveBarcodeThumbnailSrc(item);

    setSelectedBarcodeRow(item);
    setRegisterForm({
      gtin: item.gtin,
      productCategoryName: item.productCategoryName || '',
      productNameKo: item.productNameKo || item.rawProductName || '',
      brandName: item.brandName || item.manufacturerName || item.brandOwnerName || '',
      companyInfo: item.companyInfo || '',
      originInfo: item.originInfo || '',
      packageInfo: item.packageInfo || '',
      specInfo: item.specInfo || '',
      netWeight: item.netWeight || '',
      productShape: item.productShape || '',
      productNumber: item.productNumber || '',
    });
    clearThumbnailPreview();
    setThumbnailPreviewUrl(existingThumbnailSrc || null);
    setIsThumbnailLoadError(false);
    setRegisterMessage('');
    setRegisterError('');
    setModalMode('edit');
    setIsRegisterModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedBarcodeRow || !searchResult) {
      return;
    }

    if (registerSaving) {
      return;
    }

    setRegisterSaving(true);
    setRegisterError('');
    setRegisterMessage('');

    try {
      const response = await updateMasterBarcode(selectedBarcodeRow.id, {
        ...registerForm,
        thumbnail: thumbnailFile,
      });

      const nextThumbnailUrl =
        response.thumbnailUrl || selectedBarcodeRow.sourceThumbnailUrl;

    const nextItems = searchResult.items.map((item) => {
      if (item.id !== selectedBarcodeRow.id) {
        return item;
      }

      return {
        ...item,
        rawProductName: registerForm.productNameKo,
        productNameKo: registerForm.productNameKo,
        brandName: registerForm.brandName,
        gtin: registerForm.gtin,
        productCategoryName: registerForm.productCategoryName,
        companyInfo: registerForm.companyInfo,
          originInfo: registerForm.originInfo,
          packageInfo: registerForm.packageInfo,
          specInfo: registerForm.specInfo,
          netWeight: registerForm.netWeight,
          productShape: registerForm.productShape,
          productNumber: registerForm.productNumber,
          sourceThumbnailUrl: nextThumbnailUrl,
      };
    });

      setSearchResult({
        ...searchResult,
        items: nextItems,
      });
      setCardThumbnailErrorIds((current) => {
        const next = new Set(current);
        next.delete(selectedBarcodeRow.id);
        return next;
      });
      setRegisterMessage('바코드 수정 내용이 저장되었습니다.');
      closeRegisterModal();
      await loadSummary();
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : '바코드 수정에 실패했습니다.',
      );
    } finally {
      setRegisterSaving(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (modalMode === 'edit') {
      await handleEditSubmit();
      return;
    }

    if (registerSaving) {
      return;
    }

    setRegisterSaving(true);
    setRegisterError('');
    setRegisterMessage('');

    try {
      const response = await createMasterBarcode({
        ...registerForm,
        thumbnail: thumbnailFile,
      });

      setRegisterMessage(
        `바코드가 저장되었습니다. GTIN: ${response.gtin}`,
      );
      resetRegisterForm();
      setIsRegisterModalOpen(false);
      await loadSummary();
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : '바코드 저장에 실패했습니다.',
      );
    } finally {
      setRegisterSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>바코드 관리</h1>
          <p className={styles.description}>
            13자리 바코드 / CSV 텍스트 등록 / 공용 상품 원장 연결 준비
          </p>
        </div>

        <div className={styles.headerUpload}>
          <div className={styles.uploadRow}>
            <label className={styles.fileLabel}>
              <span>CSV/Excel 파일 열기</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
            </label>
            <span className={styles.fileName}>
              {csvFile ? csvFile.name : '선택된 파일 없음'}
            </span>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleUpload}
              disabled={!csvFile || uploadStatus === '업로드 중'}
            >
              업로드
            </button>
            {csvFile ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCsvCancel}
              >
                취소
              </button>
            ) : null}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={openSearchModal}
            >
              검색
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={openCreateModal}
            >
              바코드 등록
            </button>
          </div>
        </div>
      </header>

      {uploadError ? <p className={styles.errorText}>{uploadError}</p> : null}
      {registerMessage ? (
        <p className={styles.statusText}>{registerMessage}</p>
      ) : null}

      {uploadResult ? (
        <section className={styles.panel}>
          <h2>업로드 결과</h2>
          <div className={styles.uploadResultGrid}>
            <div className={styles.resultItem}>
              <span>총 행 수</span>
              <strong>{uploadResult.totalCount}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>성공 수</span>
              <strong>{uploadResult.successCount}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>실패 수</span>
              <strong>{uploadResult.failedCount}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>갱신 수</span>
              <strong>{uploadResult.duplicateCount}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p>전체 바코드</p>
          <strong>{summary.totalCount}</strong>
          <span className={styles.statHint}>master_barcodes 누적 원장</span>
        </article>
        <article className={styles.statCard}>
          <p>활성 바코드</p>
          <strong>{summary.validCount}</strong>
          <span className={styles.statHint}>13자리 GTIN 검수 기준</span>
        </article>
        <article className={styles.statCard}>
          <p>갱신 완료</p>
          <strong>{uploadResult?.duplicateCount ?? 0}</strong>
          <span className={styles.statHint}>최근 업로드 기존 row 갱신</span>
        </article>
        <article className={styles.statCard}>
          <p>미연결 상품</p>
          <strong>{summary.unlinkedCount}</strong>
          <span className={styles.statHint}>master_products 연결 대기</span>
        </article>
        <article className={styles.statCard}>
          <p>최근 업로드 수</p>
          <strong>{uploadResult?.totalCount ?? 0}</strong>
          <span className={styles.statHint}>신규/갱신/실패 합계</span>
        </article>
      </section>

      {searchError ? <p className={styles.errorText}>{searchError}</p> : null}

      <section className={styles.panel}>
        <h2>검색 결과</h2>
        {!searchResult ? (
          <div className={styles.uploadResultGrid}>
            <div className={styles.resultItem}>
              <span>운영 상태</span>
              <strong>검색 대기</strong>
            </div>
            <div className={styles.resultItem}>
              <span>최근 신규 등록</span>
              <strong>{uploadResult?.successCount ?? 0}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>최근 갱신</span>
              <strong>{uploadResult?.duplicateCount ?? 0}</strong>
            </div>
            <div className={styles.resultItem}>
              <span>최근 오류</span>
              <strong>{uploadResult?.failedCount ?? summary.errorCount}</strong>
            </div>
          </div>
        ) : searchResult.totalCount === 0 ? (
          <p className={styles.emptyRow}>검색 결과가 없습니다.</p>
        ) : (
          <>
            <p className={styles.statusText}>총 {searchResult.totalCount}건</p>
            <div className={styles.productCardGrid}>
              {searchResult.items.map((item) => (
                (() => {
                  const displayProductName = getDisplayProductName(item);
                  const cardThumbnailSrc = resolveBarcodeThumbnailSrc(item);
                  const shouldShowCardImage =
                    cardThumbnailSrc && !cardThumbnailErrorIds.has(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.productCard}
                      onClick={() => openEditModal(item)}
                      aria-label={`바코드 ${item.gtin} 수정`}
                    >
                      <div className={styles.productThumbnail}>
                        <span className={styles.thumbnailBadge}>바코드</span>
                        {shouldShowCardImage ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cardThumbnailSrc}
                              alt={`${displayProductName || item.gtin} 썸네일`}
                              className={styles.cardThumbnailImage}
                              onError={() =>
                                setCardThumbnailErrorIds((current) => {
                                  const next = new Set(current);
                                  next.add(item.id);
                                  return next;
                                })
                              }
                            />
                          </>
                        ) : (
                          <div className={styles.thumbnailLabel}>
                            {getThumbnailLabel(item)}
                          </div>
                        )}
                        <div className={styles.thumbnailOverlay}>
                          <strong>{displayProductName}</strong>
                          <p>{item.brandName || item.brandOwnerName || '-'}</p>
                        </div>
                      </div>
                      <div className={styles.productCardBody}>
                        <p className={styles.barcodeOnly}>{item.gtin}</p>
                      </div>
                    </button>
                  );
                })()
              ))}
            </div>
          </>
        )}
      </section>

      <section className={styles.guideBox}>
        <ul>
          <li>barcode는 13자리 숫자 문자열 기준으로 관리합니다.</li>
          <li>productCode는 RAPUS 내부 코드이며 barcode와 역할이 다릅니다.</li>
          <li>관리자 수기 등록 데이터는 master_barcodes에 저장합니다.</li>
          <li>판매자 상품 등록은 별도 구조에서 처리합니다.</li>
        </ul>
      </section>

      {isSearchModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={closeSearchModal}
        >
          <section
            className={styles.searchModal}
            role="dialog"
            aria-modal="true"
            aria-label="바코드 상품 검색"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>바코드 / 상품 검색</h2>
                <p>바코드, 상품명, 회사명, 브랜드명으로 조회합니다.</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeSearchModal}
              >
                닫기
              </button>
            </div>
            <div className={styles.searchModalBody}>
              <input
                className={styles.searchModalInput}
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="바코드, 상품명, 회사명, 브랜드명 입력"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void runSearch(searchDraft);
                  }
                }}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeSearchModal}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void runSearch(searchDraft)}
                disabled={searchLoading}
              >
                {searchLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isRegisterModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={closeRegisterModal}
        >
          <section
            className={styles.registerModal}
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === 'edit' ? '바코드 수정' : '바코드 등록'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>{modalMode === 'edit' ? '바코드 수정' : '바코드 등록'}</h2>
                <p>
                  {modalMode === 'edit'
                    ? '선택한 바코드 row의 표시 정보를 수정합니다.'
                    : '공용 상품 원장 연결 전 단계의 바코드 정보를 입력합니다.'}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeRegisterModal}
              >
                닫기
              </button>
            </div>

            <div className={styles.modalSection}>
              <h3>기본정보</h3>
              <div className={styles.modalGridBasic}>
                <label>
                  <span>바코드</span>
                  <input
                    value={registerForm.gtin}
                    onChange={updateRegisterForm('gtin')}
                    placeholder="13자리 숫자 바코드"
                  />
                </label>
                <label>
                  <span>상품분류명</span>
                  <input
                    value={registerForm.productCategoryName}
                    onChange={updateRegisterForm('productCategoryName')}
                    placeholder="예: 가공식품&gt;즉석/편의식품&gt;라면류"
                  />
                </label>
                <label>
                  <span>상품명(국문)</span>
                  <input
                    value={registerForm.productNameKo}
                    onChange={updateRegisterForm('productNameKo')}
                    placeholder="예: 배홍동 막국수"
                  />
                </label>
                <label>
                  <span>브랜드</span>
                  <input
                    value={registerForm.brandName}
                    onChange={updateRegisterForm('brandName')}
                    placeholder="예: 농심"
                  />
                </label>
                <div className={styles.modalImageCell}>
                  <label className={styles.imagePickerLabel}>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className={styles.hiddenFileInput}
                      onChange={handleBarcodeThumbnailChange}
                    />
                    <div className={styles.imagePlaceholder}>
                      {thumbnailPreviewUrl && !isThumbnailLoadError ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnailPreviewUrl}
                            alt={`${registerForm.productNameKo || registerForm.gtin || '바코드'} 썸네일 미리보기`}
                            className={styles.imagePreview}
                            onError={() => setIsThumbnailLoadError(true)}
                          />
                        </>
                      ) : (
                        <span>대표 썸네일 등록 Placeholder</span>
                      )}
                    </div>
                  </label>
                  <p className={styles.helperText}>최대 1024px / webp 권장</p>
                  {thumbnailPreviewUrl ? (
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={clearThumbnailPreview}
                    >
                      선택 이미지 제거
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.modalSection}>
              <h3>회사정보</h3>
              <div className={styles.modalGrid}>
                <label className={styles.modalWideField}>
                  <span>회사정보</span>
                  <input
                    value={registerForm.companyInfo}
                    onChange={updateRegisterForm('companyInfo')}
                    placeholder="[업소/업자] 회사명 주소"
                  />
                </label>
                <label>
                  <span>국가정보</span>
                  <input
                    value={registerForm.originInfo}
                    onChange={updateRegisterForm('originInfo')}
                    placeholder="[제조국] 대한민국(국산)"
                  />
                </label>
                <label>
                  <span>구성정보</span>
                  <input
                    value={registerForm.packageInfo}
                    onChange={updateRegisterForm('packageInfo')}
                    placeholder="예: 114g x 4입"
                  />
                </label>
              </div>
            </div>

            <div className={styles.modalSection}>
              <h3>규격정보</h3>
              <div className={styles.modalGrid}>
                <label className={styles.modalWideField}>
                  <span>규격정보</span>
                  <input
                    value={registerForm.specInfo}
                    onChange={updateRegisterForm('specInfo')}
                    placeholder="가로 15.5cm, 세로 12.5cm, 높이 20.5cm"
                  />
                </label>
                <label>
                  <span>순중량(NetWeight)</span>
                  <input
                    value={registerForm.netWeight}
                    onChange={updateRegisterForm('netWeight')}
                    placeholder="예: 456g"
                  />
                </label>
                <label>
                  <span>상품형태</span>
                  <input
                    value={registerForm.productShape}
                    onChange={updateRegisterForm('productShape')}
                    placeholder="예: 봉지형"
                  />
                </label>
                <label>
                  <span>품목보고번호</span>
                  <input
                    value={registerForm.productNumber}
                    onChange={updateRegisterForm('productNumber')}
                    placeholder="예: 20070149002102"
                  />
                </label>
              </div>
            </div>

            {registerError ? (
              <p className={styles.errorText}>{registerError}</p>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeRegisterModal}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handleRegisterSubmit()}
                disabled={registerSaving}
              >
                {modalMode === 'edit' ? '수정 저장' : registerSaving ? '등록 중...' : '등록'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
