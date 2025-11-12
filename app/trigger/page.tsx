"use client";

import React, { useState } from "react";
import {
  Search,
  Play,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

const MangaScraperDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedManga, setSelectedManga] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState(null);

  // Workflow configuration
  const [operation, setOperation] = useState("scrape_all");
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState("");
  const [customName, setCustomName] = useState("");

  // GitHub configuration (you'll need to set these)
  const [githubToken, setGithubToken] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");

  const predefinedMangas = [
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTriggerStatus(null);

    try {
      // Since we can't directly scrape mangaread.org from the browser due to CORS,
      // this is a simulation. In production, you'd need a backend proxy or use the GitHub workflow itself
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulated search results
      const mockResults = [
        {
          name: searchQuery,
          url: `https://www.mangaread.org/manga/${searchQuery
            .toLowerCase()
            .replace(/\s+/g, "-")}/`,
          slug: searchQuery.toLowerCase().replace(/\s+/g, "-"),
          coverImage: `https://via.placeholder.com/200x300?text=${encodeURIComponent(
            searchQuery
          )}`,
          chapters: Math.floor(Math.random() * 200) + 50,
        },
      ];

      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
      setTriggerStatus({
        type: "error",
        message: "Search failed. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const triggerWorkflow = async (manga) => {
    if (!githubToken || !githubOwner || !githubRepo) {
      setTriggerStatus({
        type: "error",
        message: "Please configure GitHub settings first (token, owner, repo)",
      });
      return;
    }

    setIsTriggering(true);
    setTriggerStatus(null);

    try {
      const workflowInputs = {
        manga_url: manga.url,
        manga_name: customName || manga.name,
        operation: operation,
        start_chapter: startChapter.toString(),
      };

      if (operation === "scrape_range" && endChapter) {
        workflowInputs.end_chapter = endChapter.toString();
      }

      const response = await fetch(
        `https://api.github.com/repos/${githubOwner}/${githubRepo}/actions/workflows/manga-scraper.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: workflowInputs,
          }),
        }
      );

      if (response.status === 204) {
        setTriggerStatus({
          type: "success",
          message: `Successfully triggered scraper for "${manga.name}"! Check GitHub Actions for progress.`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `GitHub API returned status ${response.status}`
        );
      }
    } catch (error) {
      console.error("Workflow trigger error:", error);
      setTriggerStatus({
        type: "error",
        message: `Failed to trigger workflow: ${error.message}`,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const MangaCard = ({ manga, isPredefined = false }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 overflow-hidden">
            {manga.coverImage && (
              <img
                src={manga.coverImage}
                alt={manga.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
              {manga.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
              {manga.slug}
            </p>
            {manga.chapters && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                ~{manga.chapters} chapters
              </p>
            )}
            <div className="flex gap-2">
              <a
                href={manga.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </a>
              <button
                onClick={() => setSelectedManga(manga)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Play className="w-3 h-3" />
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Manga Scraper Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search and scrape manga from mangaread.org
          </p>
        </div>

        {/* GitHub Configuration */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
            GitHub Configuration (Required)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="password"
              placeholder="GitHub Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Owner (username)"
              value={githubOwner}
              onChange={(e) => setGithubOwner(e.target.value)}
              className="px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Repository name"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-2">
            Create a token at: Settings → Developer settings → Personal access
            tokens → Fine-grained tokens
            <br />
            Required permission: <strong>Actions (Read and write)</strong>
          </p>
        </div>

        {/* Status Messages */}
        {triggerStatus && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-start gap-3 ${
              triggerStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {triggerStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                triggerStatus.type === "success"
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}
            >
              {triggerStatus.message}
            </p>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Search Manga
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter manga name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Note: Direct search is simulated. Enter a manga name to generate a
            URL for scraping.
          </p>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Search Results
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((manga, idx) => (
                <MangaCard key={idx} manga={manga} />
              ))}
            </div>
          </div>
        )}

        {/* Predefined Manga */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Access
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predefinedMangas.map((manga) => (
              <MangaCard key={manga.slug} manga={manga} isPredefined />
            ))}
          </div>
        </div>

        {/* Configuration Modal */}
        {selectedManga && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Configure Scraper
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manga
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedManga.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedManga.url}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={selectedManga.name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Operation
                    </label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="scrape_all">Scrape All Chapters</option>
                      <option value="scrape_range">Scrape Chapter Range</option>
                      <option value="scrape_single">
                        Scrape Single Chapter
                      </option>
                      <option value="verify">Verify Existing Data</option>
                    </select>
                  </div>

                  {(operation === "scrape_range" ||
                    operation === "scrape_single") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Chapter
                      </label>
                      <input
                        type="number"
                        value={startChapter}
                        onChange={(e) =>
                          setStartChapter(parseInt(e.target.value) || 1)
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {operation === "scrape_range" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Chapter
                      </label>
                      <input
                        type="number"
                        value={endChapter}
                        onChange={(e) => setEndChapter(e.target.value)}
                        min={startChapter}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedManga(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => triggerWorkflow(selectedManga)}
                    disabled={isTriggering}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isTriggering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Triggering...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Trigger Scraper
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          <p>Data stored in Supabase • Workflow runs on GitHub Actions</p>
        </div>
      </div>
    </div>
  );
};

export default MangaScraperDashboard;
