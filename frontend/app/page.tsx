import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="mb-2 text-2xl font-bold">
        소셜 플랫폼
      </h1>

      <p className="mb-8 text-sm text-gray-600">
        로그인 또는 회원가입을 진행하세요
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/auth/login"
          className="rounded bg-black py-2 text-center text-sm font-medium text-white"
        >
          로그인
        </Link>

        <Link
          href="/auth/signup"
          className="rounded border border-gray-300 py-2 text-center text-sm font-medium"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
