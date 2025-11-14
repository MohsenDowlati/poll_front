"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "@/hooks/useModal";

import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import PollResult from "@/components/sheet/PollResult";
import {
  AdminPollSummary,
  extractAdminPolls,
  extractPollPaginationMeta,
  fetchAdminPolls,
} from "@/services/poll/poll";
import { exportSheet } from "@/services/sheet/sheet";
import { useLocale } from "@/hooks/useLocale";
import { getAuthTokenFromCookie } from "@/utils/authToken";
import { decodeJwtPayload } from "@/utils/jwt";
import { isSuperAdmin } from "@/utils/roles";

interface FullScreenModalProps {
  sheetId?: string | number;
  sheetTitle?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

const containsUnsupportedColorFunction = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes("oklch(");
};

const OKLCH_REGEX = /oklch\(([^)]+)\)/gi;

interface OklchComponents {
  lightness: number;
  chroma: number;
  hue: number;
  alpha: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parsePercentage = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.endsWith("%")) {
    const numeric = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(numeric)) {
      return null;
    }
    return numeric / 100;
  }

  const numeric = parseFloat(trimmed);
  if (Number.isNaN(numeric)) {
    return null;
  }

  return numeric > 1 ? numeric / 100 : numeric;
};

const parseAngle = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(-?\d+(\.\d+)?)(deg|rad|grad|turn)?$/i);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) {
    return null;
  }

  const unit = (match[3] ?? "").toLowerCase();
  let degrees: number;
  switch (unit) {
    case "rad":
      degrees = (value * 180) / Math.PI;
      break;
    case "grad":
      degrees = value * 0.9;
      break;
    case "turn":
      degrees = value * 360;
      break;
    case "deg":
    case "":
      degrees = value;
      break;
    default:
      return null;
  }

  const normalized = ((degrees % 360) + 360) % 360;
  return normalized;
};

const parseAlpha = (raw: string | undefined): number => {
  if (!raw) {
    return 1;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return 1;
  }

  if (trimmed.endsWith("%")) {
    const numeric = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(numeric)) {
      return 1;
    }
    return clamp(numeric / 100, 0, 1);
  }

  const numeric = parseFloat(trimmed);
  if (Number.isNaN(numeric)) {
    return 1;
  }
  return clamp(numeric, 0, 1);
};

const parseOklchComponents = (raw: string): OklchComponents | null => {
  const [base, alphaPart] = raw.split("/");
  const components = base
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (components.length < 3) {
    return null;
  }

  const lightness = parsePercentage(components[0]);
  const chroma = parseFloat(components[1]);
  const hue = parseAngle(components[2]);

  if (
    lightness === null ||
    Number.isNaN(chroma) ||
    chroma < 0 ||
    hue === null
  ) {
    return null;
  }

  return {
    lightness: clamp(lightness, 0, 1),
    chroma,
    hue,
    alpha: parseAlpha(alphaPart),
  };
};

const linearToSrgb = (value: number) => {
  if (value <= 0.0031308) {
    return 12.92 * value;
  }
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
};

const formatAlpha = (value: number) => {
  if (value >= 1) {
    return "1";
  }
  if (value <= 0) {
    return "0";
  }
  if (value >= 0.99) {
    return "0.99";
  }
  return parseFloat(value.toFixed(3)).toString();
};

const convertOklchToken = (token: string): string | null => {
  const start = token.indexOf("(");
  const end = token.lastIndexOf(")");

  if (start === -1 || end === -1) {
    return null;
  }

  const content = token.slice(start + 1, end);
  const parsed = parseOklchComponents(content);
  if (!parsed) {
    return null;
  }

  const hueInRadians = (parsed.hue * Math.PI) / 180;
  const aComponent = parsed.chroma * Math.cos(hueInRadians);
  const bComponent = parsed.chroma * Math.sin(hueInRadians);

  const lComponent = parsed.lightness + 0.3963377774 * aComponent + 0.2158037573 * bComponent;
  const mComponent = parsed.lightness - 0.1055613458 * aComponent - 0.0638541728 * bComponent;
  const sComponent = parsed.lightness - 0.0894841775 * aComponent - 1.2914855480 * bComponent;

  const l = lComponent * lComponent * lComponent;
  const m = mComponent * mComponent * mComponent;
  const s = sComponent * sComponent * sComponent;

  const r = clamp(linearToSrgb(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
  ), 0, 1);
  const g = clamp(linearToSrgb(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  ), 0, 1);
  const b = clamp(linearToSrgb(
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ), 0, 1);

  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b * 255);

  if (parsed.alpha < 0.999) {
    return `rgba(${r255}, ${g255}, ${b255}, ${formatAlpha(parsed.alpha)})`;
  }

  return `rgb(${r255}, ${g255}, ${b255})`;
};

const convertColorValue = (value: string): string | null => {
  let changed = false;
  const sanitized = value.replace(OKLCH_REGEX, (match) => {
    const converted = convertOklchToken(match);
    if (!converted) {
      return match;
    }
    changed = true;
    return converted;
  });

  return changed ? sanitized : null;
};

const sanitizeColorsForHtml2Canvas = (doc: Document) => {
  const view = doc.defaultView;
  const root = doc.documentElement;

  if (!view || !root) {
    return;
  }

  const processElement = (element: Element | null) => {
    if (
      !element ||
      !("style" in element) ||
      typeof (element as HTMLElement).style?.setProperty !== "function"
    ) {
      return;
    }

    const computed = view.getComputedStyle(element);

    for (let i = 0; i < computed.length; i += 1) {
      const propertyName = computed.item(i);
      if (!propertyName) {
        continue;
      }

      const value = computed.getPropertyValue(propertyName);
      if (!containsUnsupportedColorFunction(value)) {
        continue;
      }

      const fallback = convertColorValue(value);
      if (fallback) {
        (element as HTMLElement).style.setProperty(propertyName, fallback, "important");
      }
    }
  };

  processElement(root);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    processElement(walker.currentNode as Element);
  }
};

export default function FullScreenModal({
  sheetId,
  sheetTitle,
  pageSize = DEFAULT_PAGE_SIZE,
}: FullScreenModalProps) {
  const normalizedSheetId = sheetId !== undefined && sheetId !== null ? String(sheetId).trim() : "";
  const hasSheetId = normalizedSheetId.length > 0;
  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;

  const { t } = useLocale();

  const {
    isOpen: isFullscreenModalOpen,
    openModal: openFullscreenModal,
    closeModal: closeFullscreenModal,
  } = useModal();
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const [polls, setPolls] = useState<AdminPollSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canExportSnapshots, setCanExportSnapshots] = useState(false);
  const [canExportCsv, setCanExportCsv] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const extractCategories = useCallback((raw: unknown): string[] => {
    if (Array.isArray(raw)) {
      return raw
        .map((value) =>
          typeof value === "string" ? value.trim() : String(value ?? "").trim(),
        )
        .filter((value) => value.length > 0);
    }

    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }

    return [];
  }, []);

  const loadPolls = useCallback(
    async (pageToLoad: number) => {
      if (!hasSheetId) {
        setPolls([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { status, data } = await fetchAdminPolls({
          id: normalizedSheetId,
          page: pageToLoad,
          page_size: resolvedPageSize,
        });

        if (status >= 200 && status < 300) {
          const fetchedPolls = extractAdminPolls(data);
          setPolls(fetchedPolls);

          const meta = extractPollPaginationMeta(data);
          const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : resolvedPageSize;
          const effectivePage = meta.page && meta.page > 0 ? meta.page : pageToLoad;

          let resolvedTotalPages = meta.totalPages;
          if (
            (resolvedTotalPages === undefined || resolvedTotalPages <= 0) &&
            meta.totalItems !== undefined &&
            effectivePageSize > 0
          ) {
            resolvedTotalPages = Math.ceil(meta.totalItems / effectivePageSize);
          }

          if (resolvedTotalPages === undefined) {
            const isLastPage = fetchedPolls.length < effectivePageSize;
            resolvedTotalPages = isLastPage ? Math.max(effectivePage, 1) : Math.max(effectivePage + 1, 1);
          }

          setTotalPages(Math.max(resolvedTotalPages, 1));

          setPage((current) => (current === effectivePage ? current : effectivePage));
        } else {
          setPolls([]);
          setError(t("analyze.error"));
        }
      } catch (fetchError) {
        console.error("Failed to load admin polls", fetchError);
        setPolls([]);
        setError(t("analyze.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [hasSheetId, normalizedSheetId, resolvedPageSize, t],
  );

  useEffect(() => {
    setPage(1);
    setPolls([]);
    setTotalPages(1);
    setError(null);
    setIsLoading(false);
    setExportError(null);
    setIsExporting(false);
  }, [normalizedSheetId]);

  useEffect(() => {
    if (!isFullscreenModalOpen) {
      setPolls([]);
      setError(null);
      setIsLoading(false);
      setTotalPages(1);
      setPage(1);
      setExportError(null);
      setIsExporting(false);
      return;
    }

    void loadPolls(page);
  }, [isFullscreenModalOpen, page, loadPolls]);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setCanExportSnapshots(false);
      setCanExportCsv(false);
      return;
    }

    setCanExportSnapshots(true);
    const payload = decodeJwtPayload(token);
    setCanExportCsv(isSuperAdmin(payload));
  }, []);

  const categoryLabelMap = useMemo(() => {
    const labelMap = new Map<string, string>();

    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      if (categories.length === 0) {
        return;
      }

      categories.forEach((category) => {
        const normalized = category.toLowerCase();
        if (!labelMap.has(normalized)) {
          labelMap.set(normalized, category);
        }
      });
    });

    return labelMap;
  }, [extractCategories, polls]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      if (categories.length === 0) {
        set.add("uncategorized");
        return;
      }

      categories.forEach((category) => set.add(category.toLowerCase()));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [extractCategories, polls]);

  const translateCategory = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase();
      if (normalized === "uncategorized") {
        return t("sheet.poll.uncategorized");
      }
      const translationKey = `sheet.poll.categories.${normalized}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        return translated;
      }
      return categoryLabelMap.get(normalized) ?? value;
    },
    [categoryLabelMap, t],
  );

  const pollsByCategory = useMemo(() => {
    const map = new Map<string, AdminPollSummary[]>();

    polls.forEach((poll) => {
      const categories = extractCategories(poll.category);
      const normalizedCategories =
        categories.length > 0 ? categories.map((category) => category.toLowerCase()) : ["uncategorized"];

      normalizedCategories.forEach((category) => {
        const existing = map.get(category) ?? [];
        existing.push(poll);
        map.set(category, existing);
      });
    });

    return map;
  }, [extractCategories, polls]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  const handleOpen = () => {
    if (!hasSheetId) {
      return;
    }
    openFullscreenModal();
  };

  const buildFileName = useCallback(
    (extension: string) => {
      const fallbackId = normalizedSheetId || "sheet";
      const baseName = sheetTitle?.trim() || `sheet-${fallbackId}`;
      const sanitized = baseName
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "");

      return `${sanitized || `sheet-${fallbackId}`}.${extension}`;
    },
    [normalizedSheetId, sheetTitle],
  );

  const triggerDownload = (payload: Blob | string, fileName: string) => {
    if (typeof window === "undefined") {
      console.warn("Window is undefined. Skipping file download.");
      return;
    }

    const link = document.createElement("a");
    let url: string;

    if (typeof payload === "string") {
      url = payload;
    } else {
      url = window.URL.createObjectURL(payload);
    }

    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof payload !== "string") {
      window.URL.revokeObjectURL(url);
    }
  };

  const handleCsvExport = useCallback(async () => {
    if (!hasSheetId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      const response = await exportSheet(normalizedSheetId);
      let fileName: string | undefined;
      const headers = (response.headers ?? {}) as Record<string, string | undefined>;
      const disposition =
        headers["content-disposition"] ?? headers["Content-Disposition"];

      if (disposition) {
        const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        const quotedMatch = disposition.match(/filename="?([^";]+)"?/i);
        const rawFileName = (utfMatch?.[1] ?? quotedMatch?.[1])?.trim();
        if (rawFileName) {
          try {
            fileName = decodeURIComponent(rawFileName.replace(/^["']|["']$/g, ""));
          } catch {
            fileName = rawFileName.replace(/^["']|["']$/g, "");
          }
        }
      }

      if (!fileName || fileName.trim().length === 0) {
        fileName = buildFileName("xlsx");
      }

      triggerDownload(response.data, fileName);
      closeFullscreenModal();
    } catch (exportErr) {
      console.error("Failed to export sheet", exportErr);
      setExportError(t("tables.error.exportSheet"));
    } finally {
      setIsExporting(false);
    }
  }, [buildFileName, closeFullscreenModal, hasSheetId, normalizedSheetId, t]);

  const captureSnapshot = useCallback(
    async (
      element: HTMLElement,
      {
        backgroundColor,
        pixelRatio,
      }: {
        backgroundColor: string;
        pixelRatio: number;
      },
    ): Promise<string> => {
      try {
        const htmlToImage = await import("html-to-image");
        return await htmlToImage.toJpeg(element, {
          quality: 0.95,
          pixelRatio,
          cacheBust: true,
          skipFonts: true,
          backgroundColor,
        });
      } catch (primaryError) {
        console.warn("html-to-image failed, attempting html2canvas fallback", primaryError);
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default ?? html2canvasModule;
        const canvas = await html2canvas(element, {
          backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale: pixelRatio,
          windowWidth: element.scrollWidth || undefined,
          windowHeight: element.scrollHeight || undefined,
          onclone: (clonedDocument) => {
            try {
              sanitizeColorsForHtml2Canvas(clonedDocument);
            } catch (cloneError) {
              console.warn("Failed to sanitize colors for html2canvas clone", cloneError);
            }
          },
        });
        return canvas.toDataURL("image/jpeg", 0.95);
      }
    },
    [],
  );

  const handleSnapshotExport = useCallback(
    async (format: "pdf" | "jpg") => {
      if (!hasSheetId) {
        return;
      }

      if (!modalContentRef.current) {
        setExportError(t("tables.error.exportSnapshot"));
        return;
      }

      if (typeof window === "undefined") {
        setExportError(t("tables.error.exportSnapshot"));
        return;
      }

      setExportError(null);
      setIsExporting(true);

      try {
        const element = modalContentRef.current;
        const deviceRatio = window.devicePixelRatio || 1;
        const pixelRatio = Math.min(3, deviceRatio * 1.5);
        const computed = window.getComputedStyle(element);
        const backgroundColor =
          computed.getPropertyValue("background-color") && computed.getPropertyValue("background-color") !== "rgba(0, 0, 0, 0)"
            ? computed.getPropertyValue("background-color")
            : "#ffffff";

        const dataUrl = await captureSnapshot(element, { backgroundColor, pixelRatio });

        if (format === "jpg") {
          triggerDownload(dataUrl, buildFileName("jpg"));
        } else {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF("p", "mm", "a4");
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imageRatio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
          const renderWidth = imgProps.width * imageRatio;
          const renderHeight = imgProps.height * imageRatio;
          const marginX = (pdfWidth - renderWidth) / 2;
          const marginY = (pdfHeight - renderHeight) / 2;

          pdf.addImage(dataUrl, "JPEG", marginX, marginY, renderWidth, renderHeight);
          pdf.save(buildFileName("pdf"));
        }
      } catch (snapshotError) {
        console.error("Failed to capture snapshot", snapshotError);
        setExportError(t("tables.error.exportSnapshot"));
      } finally {
        setIsExporting(false);
      }
    },
    [buildFileName, captureSnapshot, hasSheetId, modalContentRef, t],
  );

  const handleSave = useCallback(
    async (format: "pdf" | "csv" | "jpg") => {
      if (format === "csv") {
        if (!canExportCsv) {
          return;
        }
        await handleCsvExport();
        return;
      }

      if (!canExportSnapshots) {
        return;
      }

      await handleSnapshotExport(format);
    },
    [canExportCsv, canExportSnapshots, handleCsvExport, handleSnapshotExport],
  );

  const headerTitle = sheetTitle ?? (hasSheetId ? normalizedSheetId : "");



  return (
    <div>
      <Button size="sm" onClick={handleOpen} disabled={!hasSheetId}>
        {t('tables.headers.analyze')}
      </Button>
      <Modal
        isOpen={isFullscreenModalOpen}
        onClose={closeFullscreenModal}
        isFullscreen={true}
        showCloseButton={true}
      >
        <div
          ref={modalContentRef}
          className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10"
        >
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 text-title-sm dark:text-white/90">
              {t('analyze.header')}
            </h4>
            {headerTitle ? (
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{headerTitle}</p>
            ) : null}

            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
                {uniqueCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-wide dark:border-gray-700"
                  >
                    {translateCategory(category)}
                  </span>
                ))}
              </div>
            )}

            {hasSheetId ? (
              <div className="space-y-6">
                {isLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("analyze.loading")}</p>
                )}

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {!isLoading && !error && polls.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("analyze.empty")}</p>
                )}


                {uniqueCategories.map((category) => {
                  const categoryPolls = pollsByCategory.get(category) ?? [];
                  if (categoryPolls.length === 0) {
                    return null;
                  }

                  return (
                    <section key={category} className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <header className="flex items-center justify-between gap-2">
                        <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">{translateCategory(category)}</h5>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t("analyze.category.pollCount", { count: categoryPolls.length })}
                        </span>
                      </header>
                      <div className="space-y-4">
                        {categoryPolls.map((poll) => (
                          <PollResult
                            key={`${category}-${poll.id}`}
                            title={poll.title}
                            options={poll.options}
                            votes={poll.votes}
                            category={extractCategories(poll.category)}
                            type={poll.type}
                            participants={poll.participants}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("analyze.prompt.selectSheet")}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {totalPages > 1 && (
              <div className="flex flex-col justify-between gap-3 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center">
                <span>
                  {t("analyze.pagination.label", { page, total: totalPages })}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrev} disabled={!canGoPrev || isLoading}>
                    {t("actions.previous")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNext} disabled={!canGoNext || isLoading}>
                    {t("actions.next")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-end w-full gap-3">
                <Button size="sm" variant="outline" onClick={closeFullscreenModal}>
                  {t("actions.close")}
                </Button>
                {canExportSnapshots && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => void handleSave("pdf")}
                      disabled={isExporting}
                      aria-busy={isExporting}
                    >
                      {t("actions.savePdf")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleSave("jpg")}
                      disabled={isExporting}
                      aria-busy={isExporting}
                    >
                      {t("actions.saveJpg")}
                    </Button>
                  </>
                )}
                {canExportCsv && (
                  <Button
                    size="sm"
                    onClick={() => void handleSave("csv")}
                    disabled={isExporting}
                    aria-busy={isExporting}
                  >
                    {t("actions.saveCsv")}
                  </Button>
                )}
              </div>
              {exportError && (
                <p className="text-sm text-error-500 dark:text-error-400">
                  {exportError}
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
