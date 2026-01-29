export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-xl font-semibold">
          이메일 인증
        </h1>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">
            인증 코드 (6자리)
          </label>
          <input
            type="text"
            placeholder="123456"
            className="w-full rounded border px-3 py-2 text-sm text-center tracking-widest"
          />
        </div>

        <button className="w-full rounded bg-black py-2 text-sm font-medium text-white">
          인증 확인
        </button>
      </div>
    </main>
  );
}
