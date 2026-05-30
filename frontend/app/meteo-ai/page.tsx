'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { searchProducts as searchBusinessProducts, type BusinessProductSearchItem } from '@/lib/business/productSearchApi'

type ScanMode = 'QR' | 'BARCODE'
type ScanResultType = 'QR' | 'BARCODE' | null
type ProductAnalysisResult = {
  brand: string
  productName: string
  category: string
  packageType: string
  confidence: number
}
type ProductSearchItem = {
  productId: number
  productCode: string
  barcode: string
  name: string
  brand: string
  category: string
  thumbnailUrl: string | null
  packageType: string
}
type Html5QrcodeModule = typeof import('html5-qrcode')
type Html5QrcodeInstance = import('html5-qrcode').Html5Qrcode

const SCANNER_REGION_ID = 'meteo-ai-scanner-region'
const scanSteps = ['스캔', '사진촬영', 'AI 분석', '상품 등록']
const analysisSteps = [
  '상품 일치 여부 분석중...',
  '이미지 품질 분석중...',
  '패키지 분석중...',
  '텍스트 분석중...'
]
const chatSuggestions = [
  '신상품 등록 절차 알려줘',
  '상품 사진 촬영 팁',
  '마케팅 추천 전략',
  '매출 분석 방법'
]

export default function MeteoAiPage() {
  const debugLog = (...args: unknown[]) => {
    console.log('[MeteoAI Camera]', ...args)
  }

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [scanMode, setScanMode] = useState<ScanMode>('QR')
  const [message, setMessage] = useState('')
  const [scanResult, setScanResult] = useState('')
  const [scanResultType, setScanResultType] = useState<ScanResultType>(null)
  const [scanStatus, setScanStatus] = useState('카메라 준비 중')
  const [scanError, setScanError] = useState('')
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState(analysisSteps[0])
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchItem | null>(null)
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [searchMessage, setSearchMessage] = useState('검색어를 입력해주세요.')

  const scannerRef = useRef<Html5QrcodeInstance | null>(null)
  const scannerModuleRef = useRef<Html5QrcodeModule | null>(null)
  const isScanningRef = useRef(false)
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const canProceedUpload = useMemo(() => Boolean(capturedImage), [capturedImage])

  async function stopScanner() {
    const scanner = scannerRef.current

    if (!scanner) {
      return
    }

    try {
      const state = scanner.getState()
      if (state === 2) {
        await scanner.stop()
      }
    } catch {
      // noop
    }

    try {
      await scanner.clear()
    } catch {
      // noop
    }

    scannerRef.current = null
    scannerVideoRef.current = null
    isScanningRef.current = false
    setIsCameraReady(false)
  }

  async function waitForScannerVideoReady(maxAttempts = 20, intervalMs = 120) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const scannerRegion = document.getElementById(SCANNER_REGION_ID)
      const videoElement = scannerRegion?.querySelector(
        'video'
      ) as HTMLVideoElement | null

      if (
        videoElement &&
        videoElement.readyState >= 2 &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        debugLog('video ready', {
          attempt: attempt + 1,
          readyState: videoElement.readyState,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        })
        scannerVideoRef.current = videoElement
        setIsCameraReady(true)
        setScanError('')
        return true
      }

      if (videoElement) {
        debugLog('video waiting', {
          attempt: attempt + 1,
          readyState: videoElement.readyState,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        })
      } else {
        debugLog('video not found', { attempt: attempt + 1 })
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, intervalMs)
      })
    }

    setIsCameraReady(false)
    return false
  }

  function resolveResultType(decodedText: string): ScanResultType {
    const pureDigits = decodedText.replace(/\D/g, '')

    if (
      pureDigits.length === 8 ||
      pureDigits.length === 12 ||
      pureDigits.length === 13
    ) {
      return 'BARCODE'
    }

    return scanMode === 'BARCODE' ? 'BARCODE' : 'QR'
  }

  async function startScanner() {
    if (!isProductModalOpen || isScanningRef.current) {
      return
    }

    debugLog('startScanner invoked', { scanMode })
    setScanError('')
    setScanStatus(scanMode === 'QR' ? 'QR 스캔 중...' : '바코드 스캔 중...')
    setIsCameraReady(false)

    await stopScanner()

    try {
      debugLog('checking camera permission and mediaDevices')
      if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
        debugLog('mediaDevices.getUserMedia available')
      } else {
        debugLog('mediaDevices.getUserMedia unavailable')
      }

      if ('permissions' in navigator && navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: 'camera' as PermissionName
          })
          debugLog('camera permission status', permissionStatus.state)
        } catch (permissionError) {
          debugLog('camera permission query failed', permissionError)
        }
      }

      const html5QrcodeModule =
        scannerModuleRef.current || (await import('html5-qrcode'))
      scannerModuleRef.current = html5QrcodeModule

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5QrcodeModule
      debugLog('html5-qrcode module loaded')

      const formatsToSupport =
        scanMode === 'QR'
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39
            ]

      const scanner = new Html5Qrcode(SCANNER_REGION_ID, {
        formatsToSupport,
        verbose: false
      })
      debugLog('scanner instance created', { scannerRegionId: SCANNER_REGION_ID })

      scannerRef.current = scanner

      const cameraConfig = {
        fps: 10,
        qrbox:
          scanMode === 'QR'
            ? { width: 220, height: 220 }
            : { width: 320, height: 160 },
        aspectRatio: 1.777778
      }
      const onScanSuccess = (decodedText: string) => {
        setScanResult(decodedText)
        setScanResultType(resolveResultType(decodedText))
        setScanStatus('인식 성공')
        setScanError('')
      }

      try {
        debugLog('scanner.start trying facingMode: environment')
        await scanner.start(
          { facingMode: 'environment' },
          cameraConfig,
          onScanSuccess,
          () => {
            // frame miss noop
          }
        )
        debugLog('scanner.start success with facingMode: environment')
      } catch {
        debugLog('scanner.start with facingMode failed, fallback to first camera')
        const cameras = await Html5Qrcode.getCameras()
        debugLog('getCameras result', cameras)
        if (!cameras.length) {
          throw new Error('사용 가능한 카메라를 찾을 수 없습니다.')
        }

        debugLog('scanner.start trying cameraId', cameras[0].id)
        await scanner.start(
          cameras[0].id,
          cameraConfig,
          onScanSuccess,
          () => {
            // frame miss noop
          }
        )
        debugLog('scanner.start success with cameraId', cameras[0].id)
      }

      isScanningRef.current = true
      const ready = await waitForScannerVideoReady()
      debugLog('waitForScannerVideoReady result', ready)
      if (ready) {
        setScanStatus(
          scanMode === 'QR' ? 'QR 스캔 준비 완료' : '바코드 스캔 준비 완료'
        )
      }
    } catch (error) {
      debugLog('camera error', error)
      const rawMessage = error instanceof Error ? error.message : ''
      const isInsecureContext = typeof window !== 'undefined' && !window.isSecureContext

      let messageText = '카메라를 실행할 수 없습니다.'
      if (isInsecureContext) {
        messageText =
          '보안 연결(HTTPS) 또는 localhost 환경에서만 카메라를 사용할 수 있습니다.'
      } else if (/NotAllowedError|Permission/i.test(rawMessage)) {
        messageText = '카메라 권한이 거부되었습니다. 브라우저 권한을 허용해 주세요.'
      } else if (/NotFoundError|OverconstrainedError/i.test(rawMessage)) {
        messageText = '사용 가능한 카메라 장치를 찾지 못했습니다.'
      } else if (rawMessage) {
        messageText = rawMessage
      }

      setScanError(messageText)
      setScanStatus('카메라 실행 실패')
      isScanningRef.current = false
      await stopScanner()
    }
  }

  async function captureImage() {
    debugLog('captureImage clicked')

    let videoElement = scannerVideoRef.current
    if (
      !videoElement ||
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      const ready = await waitForScannerVideoReady(8, 100)
      debugLog('captureImage waitForScannerVideoReady retry', ready)
      if (!ready) {
        setScanError('카메라 영상이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      videoElement = scannerVideoRef.current
    }

    if (!videoElement) {
      setScanError('카메라 영상을 찾을 수 없습니다.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      setScanError('캡처 컨텍스트를 생성할 수 없습니다.')
      return
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.92)

    setCapturedImage(imageBase64)
    setScanStatus('사진 촬영 완료')
    setScanError('')
  }

  function openCameraPicker() {
    cameraInputRef.current?.click()
  }

  function openGalleryPicker() {
    galleryInputRef.current?.click()
  }

  function onUploadImages(event: ChangeEvent<HTMLInputElement>, source: 'camera' | 'image') {
    const files = event.target.files
    if (!files?.length) {
      return
    }

    const selectedFile = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImage(String(reader.result || ''))
      setScanStatus(source === 'camera' ? '카메라 촬영 이미지 생성 완료' : '갤러리 이미지 선택 완료')
      setScanError('')
      event.target.value = ''
    }
    reader.onerror = () => {
      setScanError('이미지 업로드 중 오류가 발생했습니다.')
      event.target.value = ''
    }
    reader.readAsDataURL(selectedFile)
  }

  function removeUploadedImage() {
    setCapturedImage(null)
    setAnalysisResult(null)
    setScanStatus('이미지 업로드 대기')
  }

  function mapSearchItem(item: BusinessProductSearchItem): ProductSearchItem {
    return {
      productId: item.productId,
      productCode: item.productCode,
      barcode: item.barcode,
      name: item.productName,
      brand: item.brandName,
      category: item.categoryName,
      thumbnailUrl: item.thumbnailUrl,
      packageType: item.categoryName || '-'
    }
  }

  async function onSearchProducts(keywordInput: string) {
    const keyword = keywordInput.trim()
    if (!keyword) {
      setSearchMessage('검색어를 입력해주세요.')
      setSearchResults([])
      return
    }

    setIsSearchingProducts(true)
    setSearchMessage('')
    setScanError('')

    try {
      const items = await searchBusinessProducts(keyword)
      const mapped = items.map(mapSearchItem)
      setSearchResults(mapped)
      setSearchMessage(mapped.length ? '' : '검색 결과가 없습니다.')
    } catch (error) {
      console.error('상품 검색 실패', error)
      setSearchResults([])
      setSearchMessage('상품 검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearchingProducts(false)
    }
  }

  useEffect(() => {
    const keyword = searchKeyword.trim()
    const isDigitsOnly = /^\d+$/.test(keyword)
    const canSearch = isDigitsOnly ? keyword.length >= 1 : keyword.length >= 2

    if (!canSearch) {
      setSearchResults([])
      setIsSearchingProducts(false)
      if (!keyword) {
        setSearchMessage('검색어를 입력해주세요.')
      } else if (isDigitsOnly) {
        setSearchMessage('바코드는 1자 이상 입력 시 검색됩니다.')
      } else {
        setSearchMessage('상품명은 2자 이상 입력 시 검색됩니다.')
      }
      return
    }

    setSearchMessage('')
    const timer = window.setTimeout(() => {
      void onSearchProducts(keyword)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchKeyword])

  function onClickProceedUpload() {
    if (!selectedProduct) {
      window.alert('상품을 먼저 선택하세요')
      return
    }

    if (!capturedImage) {
      window.alert('사진을 먼저 촬영하거나 선택하세요')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisStep(analysisSteps[0])
  }

  useEffect(() => {
    if (!isAnalyzing) {
      return
    }
    if (!selectedProduct) {
      setIsAnalyzing(false)
      return
    }

    const targetProduct = selectedProduct

    let index = 0
    const timer = window.setInterval(() => {
      const nextProgress = Math.min((index + 1) * 25, 100)
      setAnalysisProgress(nextProgress)
      setAnalysisStep(analysisSteps[Math.min(index, analysisSteps.length - 1)])
      index += 1

      if (nextProgress >= 100) {
        window.clearInterval(timer)
        setTimeout(() => {
          setIsAnalyzing(false)
          setAnalysisResult({
            brand: targetProduct.brand,
            productName: targetProduct.name,
            category: targetProduct.category,
            packageType: targetProduct.packageType,
            confidence: 92
          })
          setScanStatus('등록 완료')
        }, 500)
      }
    }, 700)

    return () => {
      window.clearInterval(timer)
    }
  }, [isAnalyzing, selectedProduct])

  useEffect(() => {
    if (!isProductModalOpen) {
      void stopScanner()
      return
    }

    debugLog('product modal opened - upload mode')
    setSearchKeyword('')
    setSearchResults([])
    setSearchMessage('검색어를 입력해주세요.')
    setSelectedProduct(null)
    setCapturedImage(null)
    setAnalysisResult(null)
    setAnalysisProgress(0)
    setAnalysisStep(analysisSteps[0])
    setScanStatus('이미지 업로드 대기')
    setScanError('')

    return () => {
      void stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductModalOpen, scanMode])

  useEffect(() => {
    return () => {
      void stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (isProductModalOpen) {
        setIsProductModalOpen(false)
      }

      if (isChatModalOpen) {
        setIsChatModalOpen(false)
      }
    }

    if (!isProductModalOpen && !isChatModalOpen) {
      return
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isProductModalOpen, isChatModalOpen])

  useEffect(() => {
    if (!isProductModalOpen) {
      return
    }

    const interval = window.setInterval(() => {
      const scannerRegion = document.getElementById(SCANNER_REGION_ID)
      const videoElement = scannerRegion?.querySelector('video') as
        | HTMLVideoElement
        | null

      debugLog('scanner dom check', {
        scannerRegionExists: Boolean(scannerRegion),
        videoExists: Boolean(videoElement),
        readyState: videoElement?.readyState ?? null,
        width: videoElement?.videoWidth ?? null,
        height: videoElement?.videoHeight ?? null
      })
    }, 1500)

    return () => {
      window.clearInterval(interval)
    }
  }, [isProductModalOpen])

  return (
    <main className="meteo-page">
      <section className="hero">
        <div className="hero__particles" aria-hidden="true" />
        <div className="hero__wave" aria-hidden="true" />
        <div className="hero__orb" aria-hidden="true">
          <span>AI</span>
        </div>

        <div className="hero__text">
          <h1>메테오AI</h1>
          <p className="hero__subtitle">AI 비즈니스 파트너</p>
          <p className="hero__description">
            상품등록부터 AI 상담까지
            <br />
            비즈니스를 더 스마트하게 도와드립니다.
          </p>
        </div>
      </section>

      <section className="feature-cards" aria-label="메인 기능">
        <article className="feature-card">
          <div
            className="feature-card__icon feature-card__icon--blue"
            aria-hidden="true"
          >
            <ProductIcon />
          </div>
          <div className="feature-card__content">
            <h2>상품등록</h2>
            <p>
              QR/바코드부터
              <br />
              상품등록까지 한번에
            </p>
          </div>
          <button
            type="button"
            className="feature-card__button feature-card__button--blue"
            onClick={() => setIsProductModalOpen(true)}
          >
            시작하기
          </button>
        </article>

        <article className="feature-card">
          <div
            className="feature-card__icon feature-card__icon--green"
            aria-hidden="true"
          >
            <ChatBubbleIcon />
          </div>
          <div className="feature-card__content">
            <h2>챗AI</h2>
            <p>
              웹 ChatGPT와 동일한
              <br />
              AI 챗봇 경험
            </p>
          </div>
          <button
            type="button"
            className="feature-card__button feature-card__button--green"
            onClick={() => setIsChatModalOpen(true)}
          >
            대화하기
          </button>
        </article>
      </section>

      {isProductModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="상품등록 모달"
          onClick={() => setIsProductModalOpen(false)}
        >
          <article
            className="modal-box panel panel--product"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="panel__header">
              <h3>상품등록</h3>
              <button
                type="button"
                className="icon-close"
                aria-label="상품등록 닫기"
                onClick={() => setIsProductModalOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="product-layout">
              <div className="product-main">
                <div className="search-box">
                  <div className="search-box__row">
                    <input
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="상품명 / QR / 바코드 검색"
                      aria-label="상품 검색"
                    />
                    <span className="search-icon" aria-hidden="true">⌕</span>
                  </div>
                </div>

                <div className="mode-toggle" role="tablist" aria-label="스캔 모드 선택">
                  <button
                    type="button"
                    className={scanMode === 'QR' ? 'mode-btn mode-btn--active' : 'mode-btn'}
                    onClick={() => setScanMode('QR')}
                    disabled
                  >
                    <QrIcon active={scanMode === 'QR'} />
                    QR (준비중)
                  </button>
                  <button
                    type="button"
                    className={scanMode === 'BARCODE' ? 'mode-btn mode-btn--active' : 'mode-btn'}
                    onClick={() => setScanMode('BARCODE')}
                    disabled
                  >
                    <BarcodeIcon active={scanMode === 'BARCODE'} />
                    바코드 (준비중)
                  </button>
                </div>

                <div className="search-result-list" aria-label="검색 결과">
                  {searchResults.map((item) => (
                    <article key={item.productId} className="search-result-item">
                      <div className="result-thumb">
                        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={`${item.name} 썸네일`} className="result-thumb__img" /> : item.name.slice(0, 2)}
                      </div>
                      <div className="result-meta">
                        <strong>{item.name}</strong>
                        <p>{item.brand}</p>
                        <small>{item.barcode || item.productCode}</small>
                      </div>
                      <button
                        type="button"
                        className="select-btn"
                        onClick={() => {
                          setSelectedProduct(item)
                          setAnalysisResult(null)
                          setScanStatus(`${item.name} 선택 완료`)
                          setScanError('')
                        }}
                      >
                        선택
                      </button>
                    </article>
                  ))}
                  {!searchResults.length ? <p className="search-empty">{isSearchingProducts ? '검색 중...' : searchMessage}</p> : null}
                </div>

                {selectedProduct ? (
                  <section className="selected-product-card">
                    <h4>선택 상품</h4>
                    <div className="selected-product-row">
                      <div className="result-thumb">
                        {selectedProduct.thumbnailUrl ? <img src={selectedProduct.thumbnailUrl} alt={`${selectedProduct.name} 썸네일`} className="result-thumb__img" /> : selectedProduct.name.slice(0, 2)}
                      </div>
                      <div className="selected-product-meta">
                        <strong>{selectedProduct.name}</strong>
                        <p>{selectedProduct.brand} · {selectedProduct.category}</p>
                        <small>바코드: {selectedProduct.barcode}</small>
                      </div>
                    </div>
                  </section>
                ) : null}

                <div className="scan-box upload-box" onClick={openGalleryPicker}>
                  <UploadIcon />
                  <strong>상품 이미지를 촬영해주세요</strong>
                  <p>또는 갤러리에서 선택하세요</p>
                  <div className="upload-inline-actions">
                    <button
                      type="button"
                      className="upload-inline-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        openCameraPicker()
                      }}
                    >
                      사진 촬영
                    </button>
                    <button
                      type="button"
                      className="upload-inline-btn upload-inline-btn--secondary"
                      onClick={(event) => {
                        event.stopPropagation()
                        openGalleryPicker()
                      }}
                    >
                      이미지 선택
                    </button>
                  </div>
                  <p className="scan-status">상태: {scanStatus}</p>
                  {scanError ? <p className="scan-error">오류: {scanError}</p> : null}
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="file-input-hidden"
                  onChange={(event) => onUploadImages(event, 'camera')}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="file-input-hidden"
                  onChange={(event) => onUploadImages(event, 'image')}
                />

                <div className="slot-wrap">
                  <p className="slot-title">썸네일 1장</p>
                  <div className="single-thumb">
                    {capturedImage ? (
                      <>
                        <img src={capturedImage} alt="촬영 썸네일" className="single-thumb__image" />
                        <button type="button" className="slot-delete" onClick={removeUploadedImage}>
                          삭제
                        </button>
                      </>
                    ) : (
                      <div className="single-thumb__empty">
                        <ImageSlotIcon />
                        <span>촬영된 이미지가 없습니다.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="scan-result-box" aria-live="polite">
                  <strong>검증 준비 상태</strong>
                  <p>{capturedImage ? '이미지 등록 완료, AI 검증 준비됨' : '촬영 또는 이미지 선택이 필요합니다.'}</p>
                  <small>유형: 선택 상품 기반 이미지 등록</small>
                </div>

                <button
                  type="button"
                  className="next-step-btn"
                  onClick={onClickProceedUpload}
                  disabled={!canProceedUpload}
                >
                  업로드 진행
                </button>

                {analysisResult ? (
                  <section className="result-card" aria-live="polite">
                    <h4>등록 완료</h4>
                    <div className="result-row"><span>브랜드</span><strong>{analysisResult.brand}</strong></div>
                    <div className="result-row"><span>상품명</span><strong>{analysisResult.productName}</strong></div>
                    <div className="result-row"><span>등록 이미지</span><strong>{capturedImage ? '1장 등록' : '없음'}</strong></div>
                    <div className="result-row"><span>검증 상태</span><strong>검증 성공 ({analysisResult.confidence}%)</strong></div>
                  </section>
                ) : null}

                <ol className="step-row">
                  {scanSteps.map((step, index) => {
                    const active = index === 0
                    return (
                      <li key={step} className={active ? 'step-item step-item--active' : 'step-item'}>
                        <span className="step-item__dot">{index + 1}</span>
                        <span className="step-item__label">{step}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>

              <aside className="product-guide">
                <h4>사용 방법</h4>
                <ol>
                  <li>상품명/QR/바코드 검색</li>
                  <li>검색 결과에서 상품 선택</li>
                  <li>상품 이미지 촬영 또는 선택</li>
                  <li>AI 검증 후 등록 완료</li>
                </ol>
              </aside>
            </div>
          </article>
        </div>
      ) : null}

      {isAnalyzing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="AI 분석 모달">
          <article className="modal-box analysis-modal">
            <h3>AI 검증중...</h3>
            <p>{analysisStep}</p>
            <div className="analysis-progress-track">
              <div className="analysis-progress-bar" style={{ width: `${analysisProgress}%` }} />
            </div>
            <strong>{analysisProgress}%</strong>
          </article>
        </div>
      ) : null}

      {isChatModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="챗AI 모달"
          onClick={() => setIsChatModalOpen(false)}
        >
          <article
            className="modal-box panel panel--chat"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="panel__header">
              <h3>챗AI</h3>
              <button
                type="button"
                className="icon-close"
                aria-label="챗AI 닫기"
                onClick={() => setIsChatModalOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="chat-panel">
              <div className="assistant-box">
                <BotIcon />
                <div className="assistant-msg">
                  <p>안녕하세요! 메테오AI 입니다.</p>
                  <p>비즈니스 운영, 상품등록, 마케팅, 고객관리 등 무엇이든 질문해 주세요.</p>
                  <p>최적의 답변을 도와드릴게요.</p>
                </div>
              </div>

              <div className="suggest-grid">
                {chatSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="suggest-btn"
                    onClick={() => setMessage(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="chat-input-box">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="메시지를 입력하세요..."
                  aria-label="채팅 입력"
                />
                <button type="button" aria-label="전송" className="send-btn">
                  <SendIcon />
                </button>
              </div>

              <p className="chat-note">
                AI 답변은 참고용이며, 정확한 정보는 공식 자료를 확인해 주세요.
              </p>
            </div>
          </article>
        </div>
      ) : null}

      <style jsx>{`
        .meteo-page {
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 70%);
          font-family: Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
          color: #111827;
          display: grid;
          gap: 18px;
        }

        .hero {
          position: relative;
          overflow: hidden;
          min-height: 280px;
          border-radius: 24px;
          background: linear-gradient(125deg, #081b4b 0%, #0a2e85 52%, #2563eb 100%);
          padding: 34px 36px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .hero__particles {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 76% 24%, rgba(125, 211, 252, 0.9) 0 1px, transparent 2px),
            radial-gradient(circle at 82% 34%, rgba(56, 189, 248, 0.7) 0 1px, transparent 2px),
            radial-gradient(circle at 70% 42%, rgba(147, 197, 253, 0.7) 0 1px, transparent 2px),
            radial-gradient(circle at 90% 38%, rgba(191, 219, 254, 0.7) 0 1px, transparent 2px);
          pointer-events: none;
          opacity: 0.75;
        }

        .hero__wave {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: -44px;
          height: 170px;
          background: radial-gradient(60% 100% at 46% 0%, rgba(125, 211, 252, 0.4), transparent 70%),
            radial-gradient(58% 100% at 72% 20%, rgba(96, 165, 250, 0.33), transparent 72%);
          pointer-events: none;
        }

        .hero__orb {
          position: absolute;
          right: clamp(18px, 6vw, 92px);
          top: 22px;
          width: clamp(150px, 22vw, 238px);
          aspect-ratio: 1;
          border-radius: 999px;
          border: 2px solid rgba(56, 189, 248, 0.88);
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.55), inset 0 0 30px rgba(37, 99, 235, 0.38);
          display: grid;
          place-items: center;
          z-index: 1;
        }

        .hero__orb::before,
        .hero__orb::after {
          content: '';
          position: absolute;
          inset: -20px;
          border-radius: inherit;
          border: 1px solid rgba(96, 165, 250, 0.44);
        }

        .hero__orb::after {
          inset: -42px;
          opacity: 0.65;
        }

        .hero__orb span {
          color: #67e8f9;
          font-size: clamp(44px, 7vw, 92px);
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .hero__text {
          position: relative;
          z-index: 2;
          max-width: 640px;
        }

        .hero h1 {
          margin: 0;
          color: #f8fbff;
          font-size: clamp(38px, 6vw, 82px);
          font-weight: 800;
          line-height: 1.03;
          letter-spacing: -0.03em;
        }

        .hero__subtitle {
          margin: 12px 0 0;
          color: #8ce2ff;
          font-size: clamp(24px, 3vw, 46px);
          font-weight: 700;
          line-height: 1.2;
        }

        .hero__description {
          margin: 12px 0 0;
          color: #e7f0ff;
          font-size: clamp(15px, 1.5vw, 27px);
          line-height: 1.45;
          font-weight: 500;
        }

        .feature-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .feature-card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #d9e3f0;
          padding: 22px;
          display: grid;
          grid-template-columns: 118px 1fr auto;
          align-items: center;
          gap: 20px;
        }

        .feature-card__icon {
          width: 112px;
          height: 112px;
          border-radius: 999px;
          display: grid;
          place-items: center;
        }

        .feature-card__icon--blue {
          background: #edf3ff;
        }

        .feature-card__icon--green {
          background: #ebf9ef;
        }

        .feature-card__content h2 {
          margin: 0;
          font-size: clamp(30px, 3.4vw, 58px);
          line-height: 1.12;
          letter-spacing: -0.03em;
        }

        .feature-card__content p {
          margin: 10px 0 0;
          color: #334155;
          font-size: clamp(16px, 1.6vw, 32px);
          line-height: 1.4;
          font-weight: 500;
        }

        .feature-card__button {
          width: 200px;
          height: 56px;
          border: 0;
          border-radius: 12px;
          color: #ffffff;
          font-size: clamp(18px, 1.6vw, 30px);
          font-weight: 800;
          letter-spacing: -0.02em;
          cursor: pointer;
        }

        .feature-card__button--blue {
          background: linear-gradient(120deg, #2563eb 0%, #1d4ed8 100%);
        }

        .feature-card__button--green {
          background: #16a34a;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.55);
          display: grid;
          place-items: center;
          padding: 16px;
        }

        .modal-box {
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #d9e3f0;
          border-radius: 20px;
          overflow: hidden;
          min-height: 520px;
        }

        .panel__header {
          min-height: 76px;
          padding: 0 22px;
          border-bottom: 1px solid #e3ebf7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel__header h3 {
          margin: 0;
          font-size: clamp(30px, 2.5vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .icon-close {
          width: 42px;
          height: 42px;
          border: 0;
          background: transparent;
          border-radius: 10px;
          font-size: 40px;
          color: #334155;
          cursor: pointer;
        }

        .product-layout {
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px;
          gap: 16px;
        }

        .product-main {
          display: grid;
          gap: 12px;
        }

        .search-box input {
          width: 100%;
          height: 48px;
          border: 1px solid #cfd8e6;
          border-radius: 12px;
          padding: 0 14px;
          font-size: 15px;
          color: #0f172a;
          outline: none;
          background: #ffffff;
        }

        .search-box__row {
          display: grid;
          grid-template-columns: 1fr 48px;
          gap: 8px;
        }

        .search-icon {
          height: 48px;
          border: 1px solid #cfd8e6;
          border-radius: 12px;
          background: #f8fbff;
          color: #64748b;
          font-size: 20px;
          display: grid;
          place-items: center;
          user-select: none;
        }

        .search-result-list {
          display: grid;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .search-result-item {
          border: 1px solid #dbe5f3;
          border-radius: 12px;
          background: #ffffff;
          padding: 10px;
          display: grid;
          grid-template-columns: 52px 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .result-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background: #e0ecff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 800;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .result-thumb__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .result-meta strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
        }

        .result-meta p,
        .result-meta small {
          margin: 0;
          color: #475569;
          font-size: 12px;
        }

        .select-btn {
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 0 12px;
          cursor: pointer;
        }

        .search-empty {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          text-align: center;
          padding: 10px 6px;
          border: 1px dashed #d7e2f1;
          border-radius: 10px;
          background: #f8fbff;
        }

        .selected-product-card {
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          background: #eff6ff;
          padding: 10px;
          display: grid;
          gap: 8px;
        }

        .selected-product-card h4 {
          margin: 0;
          color: #1e3a8a;
          font-size: 14px;
        }

        .selected-product-row {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 10px;
          align-items: center;
        }

        .selected-product-meta strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
        }

        .selected-product-meta p,
        .selected-product-meta small {
          margin: 0;
          color: #334155;
          font-size: 12px;
        }

        .mode-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mode-btn {
          height: 56px;
          border-radius: 12px;
          border: 1px solid #cfd8e6;
          background: #ffffff;
          color: #475569;
          font-size: clamp(16px, 1.3vw, 24px);
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }

        .mode-btn:disabled {
          cursor: not-allowed;
          opacity: 0.85;
        }

        .mode-btn--active {
          color: #2563eb;
          border: 2px solid #2563eb;
          background: #f3f8ff;
        }

        .scan-box {
          position: relative;
          border: 1px solid #d8e1ef;
          border-radius: 14px;
          background: #f7faff;
          min-height: 280px;
          display: grid;
          place-items: center;
          gap: 2px;
          text-align: center;
          padding: 16px;
          overflow: hidden;
        }

        .upload-box {
          cursor: pointer;
          gap: 8px;
        }

        .upload-box strong {
          font-size: clamp(18px, 1.5vw, 24px);
          color: #0f172a;
        }

        .upload-box p {
          margin: 0;
          color: #334155;
        }

        .upload-inline-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
          max-width: 360px;
        }

        .upload-inline-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .upload-inline-btn--secondary {
          background: #0f766e;
        }

        .file-input-hidden {
          display: none;
        }

        .scanner-region {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        :global(#meteo-ai-scanner-region video) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        :global(#meteo-ai-scanner-region canvas) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scan-overlay-text {
          position: relative;
          z-index: 2;
          margin-top: auto;
          margin-bottom: 8px;
          width: calc(100% - 16px);
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.64);
          color: #e2e8f0;
          padding: 10px;
          text-align: left;
        }

        .scan-overlay-text strong {
          color: #fff;
          font-size: clamp(16px, 1.5vw, 22px);
        }

        .scan-overlay-text p {
          margin: 2px 0 0;
          font-size: clamp(12px, 1vw, 16px);
          line-height: 1.3;
        }

        .scan-status {
          color: #93c5fd;
        }

        .scan-error {
          color: #fca5a5;
        }

        .corner {
          position: absolute;
          width: 26px;
          height: 26px;
          border-color: #2563eb;
          border-style: solid;
          z-index: 3;
        }

        .corner--tl {
          top: 16px;
          left: 16px;
          border-width: 4px 0 0 4px;
          border-top-left-radius: 8px;
        }

        .corner--tr {
          top: 16px;
          right: 16px;
          border-width: 4px 4px 0 0;
          border-top-right-radius: 8px;
        }

        .corner--bl {
          bottom: 16px;
          left: 16px;
          border-width: 0 0 4px 4px;
          border-bottom-left-radius: 8px;
        }

        .corner--br {
          bottom: 16px;
          right: 16px;
          border-width: 0 4px 4px 0;
          border-bottom-right-radius: 8px;
        }

        .capture-btn {
          height: 56px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(120deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: clamp(18px, 1.5vw, 28px);
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }

        .capture-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .slot-wrap {
          border-top: 1px solid #e5edf8;
          padding-top: 10px;
          display: grid;
          gap: 10px;
        }

        .slot-title {
          margin: 0;
          font-size: clamp(15px, 1vw, 19px);
          color: #334155;
          font-weight: 700;
        }

        .single-thumb {
          border: 1px dashed #c7d3e6;
          border-radius: 12px;
          min-height: 180px;
          display: grid;
          place-items: center;
          background: #fff;
          position: relative;
          overflow: hidden;
        }

        .single-thumb__image {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .single-thumb__empty {
          display: grid;
          justify-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .slot-delete {
          position: absolute;
          top: 4px;
          right: 4px;
          border: 0;
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          font-size: 11px;
          line-height: 1;
          padding: 4px 6px;
          cursor: pointer;
        }

        .scan-result-box {
          border: 1px solid #dbeafe;
          background: #eff6ff;
          border-radius: 10px;
          padding: 10px;
          display: grid;
          gap: 2px;
        }

        .scan-result-box strong {
          font-size: 15px;
          color: #1e40af;
        }

        .scan-result-box p {
          margin: 0;
          color: #0f172a;
          word-break: break-all;
          font-weight: 600;
          font-size: 14px;
        }

        .scan-result-box small {
          color: #334155;
        }

        .next-step-btn {
          height: 52px;
          border: 0;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .next-step-btn:disabled {
          background: #bfdbfe;
          color: #1e3a8a;
          cursor: not-allowed;
        }

        .result-card {
          border: 1px solid #d1fae5;
          border-radius: 12px;
          background: #f0fdf4;
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .result-card h4 {
          margin: 0;
          color: #166534;
          font-size: 16px;
        }

        .result-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 14px;
          color: #334155;
        }

        .analysis-modal {
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          padding: 24px;
          display: grid;
          gap: 14px;
          text-align: center;
        }

        .analysis-modal h3 {
          margin: 0;
          font-size: 24px;
          color: #1e3a8a;
        }

        .analysis-modal p {
          margin: 0;
          color: #334155;
          font-size: 16px;
          font-weight: 600;
        }

        .analysis-progress-track {
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .analysis-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #1d4ed8);
          transition: width 0.35s ease;
        }

        .step-row {
          margin: 2px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          border-top: 1px solid #e6edf8;
          padding-top: 10px;
        }

        .step-item {
          display: grid;
          justify-items: center;
          gap: 6px;
          color: #94a3b8;
        }

        .step-item__dot {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 700;
          background: #ffffff;
        }

        .step-item__label {
          font-size: clamp(13px, 0.95vw, 16px);
          font-weight: 600;
          text-align: center;
        }

        .step-item--active {
          color: #2563eb;
        }

        .step-item--active .step-item__dot {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
        }

        .product-guide {
          border-radius: 14px;
          border: 1px solid #e1e9f6;
          background: #f8fbff;
          padding: 14px;
          align-self: stretch;
        }

        .product-guide h4 {
          margin: 0;
          font-size: clamp(16px, 1.2vw, 20px);
        }

        .product-guide ol {
          margin: 10px 0 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
          color: #334155;
          font-size: clamp(13px, 0.95vw, 15px);
          line-height: 1.4;
        }

        .chat-panel {
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .assistant-box {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .assistant-msg {
          background: #f2f6fc;
          border: 1px solid #e2eaf6;
          border-radius: 14px;
          padding: 14px;
          color: #1f2937;
          display: grid;
          gap: 6px;
          font-size: clamp(15px, 1.1vw, 20px);
          line-height: 1.45;
          font-weight: 500;
        }

        .assistant-msg p {
          margin: 0;
        }

        .suggest-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .suggest-btn {
          min-height: 54px;
          border-radius: 12px;
          border: 1px solid #d5dfef;
          background: #ffffff;
          color: #334155;
          font-size: clamp(14px, 1vw, 18px);
          font-weight: 600;
          text-align: left;
          padding: 0 14px;
          cursor: pointer;
        }

        .chat-input-box {
          display: grid;
          grid-template-columns: 1fr 52px;
          gap: 10px;
          align-items: center;
          border: 1px solid #d7e1f0;
          border-radius: 14px;
          padding: 8px 8px 8px 14px;
          background: #ffffff;
        }

        .chat-input-box input {
          border: 0;
          outline: none;
          font-size: clamp(15px, 1vw, 18px);
          color: #1f2937;
          background: transparent;
        }

        .send-btn {
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 999px;
          background: #2563eb;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .chat-note {
          margin: 0;
          color: #6b7280;
          font-size: clamp(12px, 0.9vw, 14px);
        }

        @media (max-width: 1080px) {
          .feature-cards,
          .product-layout {
            grid-template-columns: 1fr;
          }

          .feature-card {
            grid-template-columns: 96px 1fr;
          }

          .feature-card__button {
            grid-column: 1 / -1;
            justify-self: center;
          }

          .hero {
            min-height: 250px;
          }

          .hero__orb {
            opacity: 0.5;
          }
        }
      `}</style>
    </main>
  )
}

function ProductIcon() {
  return (
    <svg width="66" height="66" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="18" width="36" height="30" rx="6" fill="#2563EB" />
      <path d="M10 24H46" stroke="#E7F0FF" strokeWidth="2.5" />
      <path d="M18 14H38L43 20H13L18 14Z" fill="#1D4ED8" />
      <rect x="18" y="30" width="4" height="11" rx="1" fill="#E7F0FF" />
      <rect x="25" y="30" width="4" height="11" rx="1" fill="#E7F0FF" />
      <rect x="32" y="30" width="4" height="11" rx="1" fill="#E7F0FF" />
      <circle cx="49" cy="41" r="11" fill="#2563EB" stroke="#DBEAFE" strokeWidth="2.5" />
      <path d="M49 36V46" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M44 41H54" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

function ChatBubbleIcon() {
  return (
    <svg width="62" height="62" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M10 31C10 20.2 19.4 12 31 12C42.6 12 52 20.2 52 31C52 41.8 42.6 50 31 50H25L18 56V48C13 44.8 10 38.6 10 31Z" fill="#16A34A" />
      <circle cx="24" cy="31" r="3" fill="#ECFDF3" />
      <circle cx="32" cy="31" r="3" fill="#ECFDF3" />
      <circle cx="40" cy="31" r="3" fill="#ECFDF3" />
    </svg>
  )
}

function QrIcon({ active }: { active: boolean }) {
  const color = active ? '#2563EB' : '#64748b'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.3" stroke={color} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.3" stroke={color} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.3" stroke={color} strokeWidth="2" />
      <path d="M15 14H17V16H15V14ZM19 14H21V18H19V14ZM15 18H17V21H15V18Z" fill={color} />
    </svg>
  )
}

function BarcodeIcon({ active }: { active: boolean }) {
  const color = active ? '#2563EB' : '#64748b'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="2" height="16" fill={color} />
      <rect x="7" y="4" width="1" height="16" fill={color} />
      <rect x="10" y="4" width="2" height="16" fill={color} />
      <rect x="14" y="4" width="1" height="16" fill={color} />
      <rect x="17" y="4" width="3" height="16" fill={color} />
    </svg>
  )
}

function CameraSmallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 7L9.3 5.2C9.6 4.8 10 4.6 10.5 4.6H13.5C14 4.6 14.4 4.8 14.7 5.2L16 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V9C3 7.9 3.9 7 5 7H8Z" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="13" r="3.2" stroke="#fff" strokeWidth="1.7" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15V6M12 6L8.5 9.5M12 6L15.5 9.5"
        stroke="#2563EB"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="15.5" width="16" height="4.5" rx="2.2" stroke="#2563EB" strokeWidth="1.9" />
      <circle cx="18.2" cy="17.7" r="0.9" fill="#2563EB" />
    </svg>
  )
}

function ImageSlotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.4" stroke="#9CA3AF" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.5" fill="#9CA3AF" />
      <path d="M6 16L10 12L13 15L16.5 11.5L19 16" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BotIcon() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#E7F0FF" />
      <rect x="18" y="23" width="28" height="20" rx="8" fill="#2563EB" />
      <circle cx="27" cy="33" r="3" fill="#EAF1FF" />
      <circle cx="37" cy="33" r="3" fill="#EAF1FF" />
      <rect x="28" y="17" width="8" height="5" rx="2.5" fill="#2563EB" />
      <circle cx="32" cy="15" r="2" fill="#1D4ED8" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12L20 4L14 12L20 20L3 12Z" fill="#fff" />
    </svg>
  )
}
