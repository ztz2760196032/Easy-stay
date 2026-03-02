import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { FilterDrawer, type FilterDraft } from "../components/FilterDrawer";
import { HotelCard } from "../components/HotelCard";
import { Skeleton } from "../components/Skeleton";
import { getHotels } from "../lib/api/hotels";
import { getTags } from "../lib/api/tags";
import type { Hotel, HotelQueryParams, Tag } from "../lib/api/types";
import { calcNights, ensureValidRange } from "../utils/date";
import { isBookableHotel, matchesKeyword, matchesTag } from "../utils/hotels";

const PAGE_SIZE = 6;

function getNumericParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function HotelListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const city = searchParams.get("city") || "";
  const keyword = searchParams.get("keyword") || "";
  const tagId = searchParams.get("tagId") || "";
  const starRating = getNumericParam(searchParams, "starRating");
  const minPrice = getNumericParam(searchParams, "minPrice");
  const maxPrice = getNumericParam(searchParams, "maxPrice");
  const safeRange = ensureValidRange(searchParams.get("checkIn") || "", searchParams.get("checkOut") || "");
  const nights = calcNights(safeRange.checkIn, safeRange.checkOut);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(keyword);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>({
    star: starRating ? String(starRating) : "",
    min: minPrice !== undefined ? String(minPrice) : "",
    max: maxPrice !== undefined ? String(maxPrice) : "",
    tag: tagId
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const tagDict = useMemo(
    () => tags.reduce<Record<string, Tag>>((acc, tag) => ({ ...acc, [tag.id]: tag }), {}),
    [tags]
  );

  const fetchHotels = useCallback(
    async (targetPage: number, reset: boolean) => {
      const query: HotelQueryParams = {
        _page: targetPage,
        _limit: PAGE_SIZE
      };

      if (city.trim()) query.city = city.trim();
      if (keyword.trim()) query.q = keyword.trim();
      if (starRating) query.starRating = starRating;
      if (minPrice !== undefined) query.minPrice_gte = minPrice;
      if (maxPrice !== undefined) query.maxPrice_lte = maxPrice;

      if (reset) setLoadingInitial(true);
      else setLoadingMore(true);
      setError("");

      try {
        const response = await getHotels(query);
        const filteredAll = response.data
          .filter(isBookableHotel)
          .filter((hotel) => matchesKeyword(hotel, keyword))
          .filter((hotel) => matchesTag(hotel, tagId));
        const filtered = filteredAll;
        const total = response.pagination.total;

        setHotels((prev) => (reset ? filtered : [...prev, ...filtered]));
        setPage(targetPage);
        setHasMore(targetPage * PAGE_SIZE < total);
      } catch {
        setError("酒店列表加载失败，请稍后重试。");
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [city, keyword, maxPrice, minPrice, starRating, tagId]
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        setTags(await getTags());
      } catch {
        setTags([]);
      }
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    setSearchInput(keyword);
    setFilterDraft({
      star: starRating ? String(starRating) : "",
      min: minPrice !== undefined ? String(minPrice) : "",
      max: maxPrice !== undefined ? String(maxPrice) : "",
      tag: tagId
    });
    void fetchHotels(1, true);
  }, [fetchHotels, keyword, maxPrice, minPrice, queryString, starRating, tagId]);

  useEffect(() => {
    if (!sentinelRef.current || loadingInitial || loadingMore || !hasMore || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void fetchHotels(page + 1, false);
      },
      { rootMargin: "220px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [error, fetchHotels, hasMore, loadingInitial, loadingMore, page]);

  function applyKeyword() {
    const next = new URLSearchParams(searchParams);
    const normalized = searchInput.trim();
    if (normalized) next.set("keyword", normalized);
    else next.delete("keyword");
    setSearchParams(next);
  }

  function applyFilter() {
    const next = new URLSearchParams(searchParams);
    if (filterDraft.star) next.set("starRating", filterDraft.star);
    else next.delete("starRating");
    if (filterDraft.min) next.set("minPrice", filterDraft.min);
    else next.delete("minPrice");
    if (filterDraft.max) next.set("maxPrice", filterDraft.max);
    else next.delete("maxPrice");
    if (filterDraft.tag) next.set("tagId", filterDraft.tag);
    else next.delete("tagId");
    setSearchParams(next);
    setIsFilterOpen(false);
  }

  function resetFilter() {
    setFilterDraft({ star: "", min: "", max: "", tag: "" });
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>酒店列表</h1>
        <p>
          {city || "全国"} · {safeRange.checkIn} 至 {safeRange.checkOut} · 共 {nights} 晚
        </p>
      </header>

      <section className="card sticky-tools">
        <div className="toolbar-row">
          <input
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyKeyword();
              }
            }}
            placeholder="搜索酒店名 / 商圈 / 地址"
            value={searchInput}
          />
          <button className="btn-primary" onClick={applyKeyword} type="button">
            搜索
          </button>
        </div>
        <div className="toolbar-row compact">
          <button className="btn-secondary" onClick={() => setIsFilterOpen(true)} type="button">
            筛选
          </button>
          <button className="btn-secondary" onClick={() => void fetchHotels(1, true)} type="button">
            刷新
          </button>
          <Link className="btn-secondary" to={`/?${queryString}`}>
            返回首页
          </Link>
        </div>
      </section>

      {loadingInitial ? (
        <>
          <Skeleton />
          <Skeleton compact />
        </>
      ) : null}

      {!loadingInitial && error ? (
        <EmptyState
          actionText="重试"
          description={error}
          onAction={() => void fetchHotels(1, true)}
          title="加载失败"
          tone="error"
        />
      ) : null}

      {!loadingInitial && !error && hotels.length === 0 ? (
        <EmptyState description="调整城市、关键词或筛选条件后再试。" title="没有找到可预订酒店" />
      ) : null}

      {!loadingInitial && !error && hotels.length > 0 ? (
        <>
          <div className="hotel-list">
            {hotels.map((hotel) => (
              <HotelCard hotel={hotel} key={hotel.id} queryString={queryString} tagDict={tagDict} />
            ))}
          </div>
          {loadingMore ? <Skeleton compact lines={2} /> : null}
          <div className="list-tail" ref={sentinelRef}>
            {hasMore ? "上滑加载更多..." : "没有更多酒店了"}
          </div>
        </>
      ) : null}

      <FilterDrawer
        draft={filterDraft}
        onApply={applyFilter}
        onClose={() => setIsFilterOpen(false)}
        onDraftChange={setFilterDraft}
        onReset={resetFilter}
        open={isFilterOpen}
        tags={tags}
      />
    </section>
  );
}
