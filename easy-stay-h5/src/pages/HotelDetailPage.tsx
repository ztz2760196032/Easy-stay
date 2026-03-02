import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ImageCarousel } from "../components/ImageCarousel";
import { Skeleton } from "../components/Skeleton";
import { TagList } from "../components/TagList";
import { getHotelById } from "../lib/api/hotels";
import { getTags } from "../lib/api/tags";
import type { Hotel, Room, Tag } from "../lib/api/types";
import { calcNights, ensureValidRange, formatDateInput } from "../utils/date";
import { isBookableHotel } from "../utils/hotels";

export function HotelDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const safeRange = ensureValidRange(
    searchParams.get("checkIn") || formatDateInput(new Date()),
    searchParams.get("checkOut") || ""
  );
  const nights = calcNights(safeRange.checkIn, safeRange.checkOut);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        const [hotelRes, tagsRes] = await Promise.all([getHotelById(id), getTags()]);
        setHotel(hotelRes);
        setTags(tagsRes);
      } catch {
        setError("酒店详情加载失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, [id]);

  const roomList = useMemo<Room[]>(
    () => (hotel?.rooms ? [...hotel.rooms].sort((a, b) => a.price - b.price) : []),
    [hotel?.rooms]
  );

  useEffect(() => {
    if (!roomList.length) return;
    setSelectedRoomId(roomList[0].id);
  }, [roomList]);

  const selectedRoom = roomList.find((room) => room.id === selectedRoomId);
  const tagDict = useMemo(
    () => tags.reduce<Record<string, Tag>>((acc, tag) => ({ ...acc, [tag.id]: tag }), {}),
    [tags]
  );
  const mappedTags = hotel?.tagIds.map((tagId) => tagDict[tagId]).filter(Boolean) ?? [];
  const backTo = `/list${location.search || ""}`;

  if (loading) {
    return (
      <section className="page">
        <Skeleton />
        <Skeleton compact />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <EmptyState
          actionText="返回列表"
          description={error}
          onAction={() => navigate(backTo)}
          title="加载失败"
          tone="error"
        />
      </section>
    );
  }

  if (!hotel) {
    return (
      <section className="page">
        <EmptyState
          actionText="返回列表"
          description="当前酒店已被删除或未录入。"
          onAction={() => navigate(backTo)}
          title="酒店不存在"
        />
      </section>
    );
  }

  return (
    <section className="page">
      <header className="card detail-head">
        <Link className="btn-secondary back-btn" to={backTo}>
          返回列表
        </Link>
        <h1>{hotel.name}</h1>
        <p>
          {hotel.city} · {hotel.district} · {hotel.starRating} 星
        </p>
      </header>

      <ImageCarousel alt={hotel.name} images={hotel.images} />

      <section className="card">
        {!isBookableHotel(hotel) ? (
          <div className="warning-box">
            当前酒店不可预订：{hotel.auditStatus !== "APPROVED" ? "审核未通过/待审核" : "已下线"}
            {hotel.offlineReason ? `，原因：${hotel.offlineReason}` : ""}
          </div>
        ) : null}
        <p className="hotel-card-address">{hotel.address}</p>
        <p className="hotel-card-desc">{hotel.description}</p>
        <TagList tags={mappedTags} />
        <div className="meta-row">
          <span>
            入住 {safeRange.checkIn} / 离店 {safeRange.checkOut}
          </span>
          <strong>{nights} 晚</strong>
        </div>
        <div className="facility-list">
          {hotel.facilities.map((facility) => (
            <span className="facility-chip" key={facility}>
              {facility}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>房型（价格升序）</h2>
        </div>
        <div className="room-list">
          {roomList.map((room) => (
            <button
              className={`room-item ${selectedRoomId === room.id ? "selected" : ""}`}
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              type="button"
            >
              <div>
                <h3>{room.name}</h3>
                <p>{room.cancelPolicy}</p>
                <p>{room.breakfast ? "含早餐" : "不含早餐"}</p>
              </div>
              <div className="room-price">
                <span>¥</span>
                <strong>{room.price}</strong>
                <small>/晚</small>
              </div>
            </button>
          ))}
        </div>
        {selectedRoom ? (
          <div className="selected-room">
            已选房型：{selectedRoom.name}（¥{selectedRoom.price}/晚）
          </div>
        ) : null}
      </section>
    </section>
  );
}
