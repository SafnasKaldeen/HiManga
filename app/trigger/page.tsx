import MangaScrapeButton from "@/components/MangaScrapeButton";

const mangaList = [
  {
    slug: "muscle-joseon",
    url: "https://www.mangaread.org/manga/muscle-joseon/",
    name: "Muscle - Joseon",
  },
  {
    slug: "shangri-la-frontier",
    url: "https://www.mangaread.org/manga/shangri-la-frontier/",
    name: "Shangri-La Frontier",
  },
  {
    slug: "sakamoto-days",
    url: "https://www.mangaread.org/manga/sakamoto-days/",
    name: "Sakamoto Days",
  },
];

export default function ScraperPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Manga Scraper Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Check for new chapters and trigger automatic scraping
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">How it works:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Click "Check for New Chapters" to trigger the scraper</li>
                <li>Only NEW or FAILED chapters will be downloaded</li>
                <li>Already complete chapters are automatically skipped</li>
                <li>Progress can be monitored on GitHub Actions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Manga Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mangaList.map((manga) => (
            <MangaScrapeButton key={manga.slug} manga={manga} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All chapters are stored in Cloudinary • Metadata tracked in GitHub
          </p>
          <a
            href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/actions`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all GitHub Actions runs
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
