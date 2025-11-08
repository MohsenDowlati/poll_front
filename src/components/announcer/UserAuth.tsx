import Image from "next/image";

export default function UserAuth() {
  return (
    <div className="rounded-2xl bg-white px-8 py-10 text-center shadow-theme-lg dark:bg-gray-900">
      <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
        <Image
          src="/images/cards/salon1.jpg"
          alt="Contact support to confirm access"
          width={96}
          height={96}
          className="h-full w-full object-cover"
        />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Access Restricted
      </h2>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Your account status currently prevents access to this page. Please reach out to our support team to confirm your access.
      </p>
    </div>
  );
}
