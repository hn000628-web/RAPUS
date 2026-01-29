export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-xl font-semibold">
          로그인
        </h1>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            이메일
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">
            비밀번호
          </label>
          <input
            type="password"
            placeholder="비밀번호 입력"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <button className="w-full rounded bg-black py-2 text-sm font-medium text-white">
          로그인
        </button>
      </div>
    </main>
  );
}
