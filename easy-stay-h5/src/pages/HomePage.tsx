import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "../components/DateRangePicker";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { TagList } from "../components/TagList";
import { getHotels } from "../lib/api/hotels";
import { getTags } from "../lib/api/tags";
import type { Hotel, Tag } from "../lib/api/types";
import { addDays, ensureValidRange, formatDateInput } from "../utils/date";
import { isBookableHotel } from "../utils/hotels";

interface SearchForm {
  city: string;
  keyword: string;
  checkIn: string;
  checkOut: string;
  starRating: string;
  minPrice: string;
  maxPrice: string;
  tagId: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const today = formatDateInput(new Date());
  const [recommendedHotels, setRecommendedHotels] = useState<Hotel[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SearchForm>({
    city: "",
    keyword: "",
    checkIn: today,
    checkOut: addDays(today, 1),
    starRating: "",
    minPrice: "",
    maxPrice: "",
    tagId: ""
  });

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        const [hotelRes, tagRes] = await Promise.all([
          getHotels({ _page: 1, _limit: 8, auditStatus: "APPROVED", isOnline: true }),
          getTags()
        ]);
        setRecommendedHotels(hotelRes.data.filter(isBookableHotel).slice(0, 2));
        setTags(tagRes);
      } catch {
        setError("推荐酒店加载失败，请检查后端服务是否启动。");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const selectedTag = useMemo(() => tags.find((tag) => tag.id === form.tagId), [form.tagId, tags]);
  const safeRange = ensureValidRange(form.checkIn, form.checkOut);

  function updateForm<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (form.city.trim()) params.set("city", form.city.trim());
    if (form.keyword.trim()) params.set("keyword", form.keyword.trim());
    params.set("checkIn", safeRange.checkIn);
    params.set("checkOut", safeRange.checkOut);
    if (form.starRating) params.set("starRating", form.starRating);
    if (form.minPrice) params.set("minPrice", form.minPrice);
    if (form.maxPrice) params.set("maxPrice", form.maxPrice);
    if (form.tagId) params.set("tagId", form.tagId);

    navigate(`/list?${params.toString()}`);
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>易宿酒店预订</h1>
        <p>查找已审核上架酒店，支持城市、关键词、价格与标签组合筛选。</p>
      </header>

      <section className="card">
        <div className="section-title-row">
          <h2>推荐酒店</h2>
        </div>
        {loading ? (
          <>
            <Skeleton />
            <Skeleton compact />
          </>
        ) : null}
        {!loading && error ? (
          <EmptyState
            actionText="重新加载"
            description={error}
            onAction={() => window.location.reload()}
            title="加载失败"
            tone="error"
          />
        ) : null}
        {!loading && !error && !recommendedHotels.length ? (
          <EmptyState description="当前暂无可预订酒店，你可以直接进入列表页查看全部数据。" title="暂无推荐" />
        ) : null}
        {!loading && !error ? (
          <div className="recommend-grid">
            {recommendedHotels.map((hotel) => (
              <button
                className="recommend-card"
                key={hotel.id}
                onClick={() => navigate(`/hotel/${hotel.id}?checkIn=${safeRange.checkIn}&checkOut=${safeRange.checkOut}`)}
                type="button"
              >
                <img src={hotel.images[0]} alt={hotel.name} />
                <div>
                  <h3>{hotel.name}</h3>
                  <p>
                    {hotel.city} · {hotel.starRating} 星 · ¥{hotel.minPrice} 起
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <form className="card search-form" onSubmit={submitSearch}>
        <div className="section-title-row">
          <h2>查询酒店</h2>
        </div>

        <div className="field-grid">
          <label>
            城市
            <input
              onChange={(event) => updateForm("city", event.target.value)}
              placeholder="如 上海 / 杭州"
              value={form.city}
            />
          </label>
          <label>
            关键词
            <input
              onChange={(event) => updateForm("keyword", event.target.value)}
              placeholder="酒店名 / 商圈"
              value={form.keyword}
            />
          </label>
        </div>

        <DateRangePicker
          checkIn={safeRange.checkIn}
          checkOut={safeRange.checkOut}
          onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
        />

        <div className="field-grid">
          <label>
            星级
            <select onChange={(event) => updateForm("starRating", event.target.value)} value={form.starRating}>
              <option value="">不限</option>
              {[3, 4, 5].map((star) => (
                <option key={star} value={star}>
                  {star} 星
                </option>
              ))}
            </select>
          </label>
          <label>
            快捷标签
            <select onChange={(event) => updateForm("tagId", event.target.value)} value={form.tagId}>
              <option value="">不限</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-grid">
          <label>
            最低价
            <input
              min={0}
              onChange={(event) => updateForm("minPrice", event.target.value)}
              placeholder="如 300"
              type="number"
              value={form.minPrice}
            />
          </label>
          <label>
            最高价
            <input
              min={0}
              onChange={(event) => updateForm("maxPrice", event.target.value)}
              placeholder="如 900"
              type="number"
              value={form.maxPrice}
            />
          </label>
        </div>

        {selectedTag ? <TagList tags={[selectedTag]} /> : null}
        <button className="btn-primary full-width" type="submit">
          查询酒店
        </button>
      </form>
    </section>
  );
}
