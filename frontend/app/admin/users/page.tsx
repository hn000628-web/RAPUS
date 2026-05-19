// FILE : frontend/app/admin/users/page.tsx
// ROOT : frontend/app/admin/users/page.tsx
// STATUS : PRODUCTION SAFE FINAL
// ROLE : ADMIN USERS MANAGEMENT PAGE (USERS TABLE ONLY + PAGINATION)
// CHANGE SUMMARY :
// - 기존 profiles 조인 목록 UI 제거 유지
// - ADMIN USERS 페이지를 users 테이블 기준 관리 페이지로 유지
// - CSV 업로드는 users 기준 계정/프로필 자동 생성 시작점으로 유지
// - 한 페이지 최대 50개 출력 제한 추가
// - 50개 초과 데이터는 페이지 번호 [1], [2], [3] 형태로 이동
// - STATUS / DELETE는 userId 기준 유지
// - profileId / channelCode / profileType / displayName 메인 목록 제거 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useRef,
  useState
} from 'react'

import type {
  ChangeEvent
} from 'react'

import {
  adminFetch,
  adminFileFetch
} from '@/lib/adminApi'

// SECTION 02 : TYPE

type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'

type UserRow = {
  userId: number
  email: string
  baseCode: string | null
  phone: string | null
  accountType: string
  type: string
  status: UserStatus
  profileCount: number
  createdAt: string | null
}

// SECTION 03 : CONSTANT

const PAGE_SIZE =
  50

// SECTION 04 : HELPER

function maskPhone(
  phone: string | null
) {
  if (!phone) {
    return '-'
  }

  return phone.replace(
    /(\d{3})-(\d{4})-(\d{4})/,
    '$1-****-$3'
  )
}

function formatText(
  value: string | null
) {
  if (!value) {
    return '-'
  }

  return value
}

function formatCount(
  value: number
) {
  if (Number.isNaN(value)) {
    return 0
  }

  return value
}

function getTotalPages(
  totalCount: number
) {
  if (totalCount <= 0) {
    return 1
  }

  return Math.ceil(
    totalCount / PAGE_SIZE
  )
}

// SECTION 05 : COMPONENT

export default function UsersPage() {
  // SECTION 06 : STATE

  const [
    users,
    setUsers
  ] = useState<UserRow[]>([])

  const [
    loading,
    setLoading
  ] = useState<boolean>(false)

  const [
    uploadFile,
    setUploadFile
  ] = useState<File | null>(null)

  const [
    currentPage,
    setCurrentPage
  ] = useState<number>(1)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  // SECTION 07 : PAGINATION VALUE

  const totalPages =
    getTotalPages(
      users.length
    )

  const startIndex =
    (currentPage - 1) * PAGE_SIZE

  const endIndex =
    startIndex + PAGE_SIZE

  const pageUsers =
    users.slice(
      startIndex,
      endIndex
    )

  // SECTION 08 : DATA FUNCTION

  const fetchUsers = async () => {
    setLoading(true)

    try {
      const data =
        await adminFetch<UserRow[]>(
          '/users'
        )

      setUsers(data)
      setCurrentPage(1)
    } catch (err) {
      console.error(
        'users fetch fail',
        err
      )
    }

    setLoading(false)
  }

  // SECTION 09 : EFFECT

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const maxPage =
      getTotalPages(
        users.length
      )

    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [
    users.length,
    currentPage
  ])

  // SECTION 10 : EVENT FUNCTION

  const toggleStatus =
    async (
      userId: number
    ) => {
      const user =
        users.find(
          item => item.userId === userId
        )

      if (!user) {
        return
      }

      const status: UserStatus =
        user.status === 'ACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE'

      await adminFetch(
        `/users/${userId}`,
        {
          method: 'PATCH',
          body: {
            status
          }
        }
      )

      setUsers(prev =>
        prev.map(item =>
          item.userId === userId
            ? {
                ...item,
                status
              }
            : item
        )
      )
    }

  const deleteUser =
    async (
      userId: number
    ) => {
      await adminFetch(
        `/users/${userId}`,
        {
          method: 'DELETE'
        }
      )

      setUsers(prev =>
        prev.filter(
          item => item.userId !== userId
        )
      )
    }

  const addUser =
    async () => {
      const timestamp =
        Date.now()

      await adminFetch(
        '/users',
        {
          method: 'POST',
          body: {
            email:
              `admin.user.${timestamp}@example.com`,
            displayName:
              `admin_user_${timestamp}`,
            accountType:
              'USER',
            type:
              'normal'
          }
        }
      )

      fetchUsers()
    }

  const selectFile =
    (
      e: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0] || null

      if (
        file &&
        file.name.toLowerCase().endsWith('.csv')
      ) {
        setUploadFile(file)
        return
      }

      setUploadFile(null)
    }

  const uploadCSV =
    async () => {
      if (!uploadFile) {
        return
      }

      const form =
        new FormData()

      form.append(
        'file',
        uploadFile
      )

      await adminFileFetch(
        '/users/upload',
        form
      )

      setUploadFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      fetchUsers()
    }

  const openDevPage =
    () => {
      window.open(
        '/dev-login',
        '_blank'
      )
    }

  const movePage =
    (
      page: number
    ) => {
      if (
        page < 1 ||
        page > totalPages
      ) {
        return
      }

      setCurrentPage(page)
    }

  // SECTION 11 : UI BLOCK

  const Pagination =
    () => {
      if (users.length <= PAGE_SIZE) {
        return null
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 16,
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              marginRight: 6,
              fontSize: 13,
              color: '#555'
            }}
          >
            TOTAL {users.length} / PAGE {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              movePage(
                currentPage - 1
              )
            }
            disabled={currentPage === 1}
          >
            PREV
          </button>

          {Array.from(
            {
              length: totalPages
            },
            (
              _,
              index
            ) => {
              const page =
                index + 1

              return (
                <button
                  key={page}
                  onClick={() =>
                    movePage(
                      page
                    )
                  }
                  style={{
                    fontWeight:
                      currentPage === page
                        ? 700
                        : 400
                  }}
                >
                  [{page}]
                </button>
              )
            }
          )}

          <button
            onClick={() =>
              movePage(
                currentPage + 1
              )
            }
            disabled={currentPage === totalPages}
          >
            NEXT
          </button>
        </div>
      )
    }

  const UsersTable =
    () => {
      if (loading) {
        return (
          <p>
            loading...
          </p>
        )
      }

      if (!users.length) {
        return (
          <p>
            no users
          </p>
        )
      }

      return (
        <>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 20
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  User
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Email
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  BaseCode
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Phone
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Account
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Type
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Profiles
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Status
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Created
                </th>

                <th
                  style={{
                    textAlign: 'left',
                    padding: 8
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {pageUsers.map(user => (
                <tr
                  key={user.userId}
                >
                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {user.userId}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {user.email}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {formatText(
                      user.baseCode
                    )}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {maskPhone(
                      user.phone
                    )}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {user.accountType}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {user.type}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {formatCount(
                      user.profileCount
                    )}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {user.status}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee'
                    }}
                  >
                    {formatText(
                      user.createdAt
                    )}
                  </td>

                  <td
                    style={{
                      padding: 8,
                      borderTop: '1px solid #eee',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <button
                      onClick={() =>
                        toggleStatus(
                          user.userId
                        )
                      }
                    >
                      STATUS
                    </button>

                    <button
                      onClick={() =>
                        deleteUser(
                          user.userId
                        )
                      }
                      style={{
                        marginLeft: 6
                      }}
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination />
        </>
      )
    }

  const ActionBar =
    () => (
      <div
        style={{
          marginBottom: 10,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={fetchUsers}
        >
          REFRESH
        </button>

        <button
          onClick={addUser}
        >
          ADD USER
        </button>

        <button
          onClick={openDevPage}
        >
          DEV PAGE
        </button>

        <button
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          {uploadFile
            ? uploadFile.name
            : 'CSV'}
        </button>

        <button
          onClick={uploadCSV}
          disabled={!uploadFile}
        >
          UPLOAD
        </button>
      </div>
    )

  // SECTION 12 : RETURN

  return (
    <div
      style={{
        padding: 20
      }}
    >
      <h1>
        ADMIN USERS
      </h1>

      <ActionBar />

      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{
          display: 'none'
        }}
        onChange={selectFile}
      />

      <UsersTable />
    </div>
  )
}