'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  connectBusinessCustomDomain,
  disconnectBusinessCustomDomain,
  fetchBusinessCustomDomains,
  getMyBusinessProfileFull,
  type ProfileCustomDomain
} from '@/lib/business/profile-settings-api'

import styles from './BusinessDomainPage.module.css'

type DomainStatus =
  ProfileCustomDomain['domainStatus']

const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  PENDING: '대기',
  ACTIVE: '활성',
  FAILED: '실패',
  DISABLED: '비활성'
}

const REGISTRAR_GUIDES = [
  {
    name: '가비아',
    description: '도메인 구매 후 DNS 관리 화면에서 RAPUS 연결 정보를 설정합니다.'
  },
  {
    name: '카페24',
    description: '보유 도메인 또는 신규 도메인을 등록한 뒤 RAPUS 채널에 연결합니다.'
  }
]

export default function BusinessDomainPage() {
  const [profileId, setProfileId] =
    useState<number | null>(null)
  const [channelCode, setChannelCode] =
    useState('')
  const [domains, setDomains] =
    useState<ProfileCustomDomain[]>([])
  const [connectDomain, setConnectDomain] =
    useState('')
  const [searchKeyword, setSearchKeyword] =
    useState('')
  const [isLoading, setIsLoading] =
    useState(true)
  const [isSaving, setIsSaving] =
    useState(false)
  const [message, setMessage] =
    useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  const activeDomain =
    useMemo(() => {
      return domains.find((domain) => domain.isActive) ?? null
    }, [
      domains
    ])

  useEffect(() => {
    let cancelled =
      false

    async function loadDomains() {
      try {
        const profileFull =
          await getMyBusinessProfileFull()
        const nextProfileId =
          profileFull.profile.id
        const nextChannelCode =
          profileFull.profile.channelCode

        const nextDomains =
          await fetchBusinessCustomDomains(nextProfileId)

        if (!cancelled) {
          setProfileId(nextProfileId)
          setChannelCode(nextChannelCode)
          setDomains(nextDomains)
          setConnectDomain(nextDomains[0]?.customDomain ?? '')
        }
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          setErrorMessage('도메인 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDomains()

    return () => {
      cancelled = true
    }
  }, [])

  const validateDomain = (value: string) => {
    const normalizedValue =
      value.trim()
    const domainPattern =
      /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/

    return (
      normalizedValue.length > 0 &&
      value === normalizedValue &&
      domainPattern.test(normalizedValue)
    )
  }

  const clearNotice = () => {
    setMessage('')
    setErrorMessage('')
  }

  const getErrorText = (error: unknown) => {
    if (error instanceof Error && error.message) {
      return error.message
    }

    return '요청을 처리하지 못했습니다.'
  }

  const handleConnectDomain = async () => {
    if (!profileId) {
      setErrorMessage('비즈니스 프로필 정보를 확인할 수 없습니다.')
      return
    }

    if (!validateDomain(connectDomain)) {
      setErrorMessage('올바른 도메인 형식을 입력해주세요.')
      return
    }

    setIsSaving(true)
    clearNotice()

    try {
      const nextDomains =
        await connectBusinessCustomDomain(
          profileId,
          connectDomain.trim().toLowerCase()
        )

      setDomains(nextDomains)
      setConnectDomain(nextDomains[0]?.customDomain ?? connectDomain.trim().toLowerCase())
      setMessage('도메인 연결 정보가 저장되었습니다.')
    } catch (error) {
      console.error(error)
      setErrorMessage(getErrorText(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnectDomain = async (domainId: number) => {
    if (!profileId || isSaving) {
      return
    }

    setIsSaving(true)
    clearNotice()

    try {
      const nextDomains =
        await disconnectBusinessCustomDomain(profileId, domainId)

      setDomains(nextDomains)
      setConnectDomain('')
      setMessage('도메인 연결을 해제했습니다.')
    } catch (error) {
      console.error(error)
      setErrorMessage(getErrorText(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSearchDomain = () => {
    const normalizedKeyword =
      searchKeyword.trim().toLowerCase()

    clearNotice()

    if (!normalizedKeyword) {
      setErrorMessage('검색어를 입력해주세요.')
      return
    }

    setMessage(
      '도메인 검색은 등록기관 연동 후 제공됩니다. 보유 중인 도메인은 신규 도메인 연결에서 바로 연결할 수 있습니다.'
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              BUSINESS DOMAIN
            </p>
            <h1 className={styles.pageTitle}>
              도메인 관리
            </h1>
            <p className={styles.pageDescription}>
              사업자 도메인을 RAPUS 채널에 연결합니다.
            </p>
          </div>

          <div className={styles.channelBox}>
            <span className={styles.channelLabel}>
              연결 기준
            </span>
            <strong className={styles.channelCode}>
              {channelCode || '채널 확인중'}
            </strong>
          </div>
        </header>

        {message ? (
          <p className={styles.successMessage}>
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className={styles.errorMessage}>
            {errorMessage}
          </p>
        ) : null}

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                현재 연결 도메인
              </h2>
              <p className={styles.sectionDescription}>
                RAPUS 채널에 연결된 외부 진입 주소입니다.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.emptyBox}>
              도메인 정보를 불러오는 중입니다.
            </div>
          ) : activeDomain ? (
            <div className={styles.domainTable}>
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className={styles.domainRow}
                >
                  <div className={styles.domainMain}>
                    <span className={styles.domainName}>
                      {domain.customDomain}
                    </span>
                    <span className={styles.domainMeta}>
                      연결일 {formatDate(domain.createdAt)}
                    </span>
                  </div>

                  <span className={getStatusClassName(domain.domainStatus)}>
                    {DOMAIN_STATUS_LABELS[domain.domainStatus]}
                  </span>

                  <span className={styles.primaryBadge}>
                    {domain.isPrimary ? '대표' : '보조'}
                  </span>

                  <button
                    type="button"
                    className={styles.disconnectButton}
                    disabled={isSaving}
                    onClick={() => {
                      handleDisconnectDomain(domain.id)
                    }}
                  >
                    연결 해제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBox}>
              아직 연결된 도메인이 없습니다.
            </div>
          )}
        </section>

        <section className={styles.gridSection}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  신규 도메인 연결
                </h2>
                <p className={styles.sectionDescription}>
                  보유 중인 도메인을 이 비즈니스 채널(channelCode)에 연결합니다.
                </p>
              </div>
            </div>

            <label className={styles.inputGroup}>
              <span className={styles.inputLabel}>
                연결 도메인
              </span>
              <input
                className={styles.input}
                type="text"
                value={connectDomain}
                onChange={(event) => {
                  setConnectDomain(event.target.value)
                  clearNotice()
                }}
                placeholder="example.com 또는 www.example.com"
              />
              <span className={styles.helperText}>
                보유 중인 도메인을 이 비즈니스 채널(channelCode)에 연결합니다.
              </span>
            </label>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSaving}
              onClick={handleConnectDomain}
            >
              RAPUS 채널에 연결
            </button>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  신규 도메인 검색
                </h2>
                <p className={styles.sectionDescription}>
                  등록 가능한 도메인을 먼저 확인해보세요.
                </p>
              </div>
            </div>

            <label className={styles.inputGroup}>
              <span className={styles.inputLabel}>
                검색어
              </span>
              <input
                className={styles.input}
                type="text"
                value={searchKeyword}
                onChange={(event) => {
                  setSearchKeyword(event.target.value)
                  clearNotice()
                }}
                placeholder="원하는 도메인을 검색하세요"
              />
            </label>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleSearchDomain}
            >
              도메인 검색
            </button>

            <p className={styles.helperText}>
              등록기관 검색 API는 아직 연결하지 않았습니다. 실제 도메인 연결은 위 입력 영역에서 처리됩니다.
            </p>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  도메인 등록 안내
                </h2>
                <p className={styles.sectionDescription}>
                  도메인 등록 후 RAPUS에 연결할 수 있습니다.
                </p>
              </div>
            </div>

            <div className={styles.registrarGrid}>
              {REGISTRAR_GUIDES.map((guide) => (
                <article
                  key={guide.name}
                  className={styles.registrarCard}
                >
                  <strong>{guide.name}</strong>
                  <p>{guide.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  DNS 연결 안내
                </h2>
                <p className={styles.sectionDescription}>
                  도메인 DNS에서 RAPUS 연결 정보를 설정합니다.
                </p>
              </div>
            </div>

            <div className={styles.dnsGuideList}>
              <div className={styles.dnsGuideItem}>
                <strong>A Record</strong>
                <span>루트 도메인 연결 시 RAPUS 안내 IP로 지정합니다.</span>
              </div>
              <div className={styles.dnsGuideItem}>
                <strong>CNAME</strong>
                <span>www 또는 서브도메인을 RAPUS 연결 주소로 지정합니다.</span>
              </div>
              <div className={styles.dnsGuideItem}>
                <strong>RAPUS 연결 방식</strong>
                <span>도메인 요청을 channelCode로 resolve해 RAPUS 페이지를 렌더링합니다.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function formatDate(value: string | null) {
  if (!value) {
    return '미확인'
  }

  const date =
    new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('ko-KR')
}

function getStatusClassName(status: DomainStatus) {
  return [
    styles.statusBadge,
    styles[`status${status}`]
  ].join(' ')
}
