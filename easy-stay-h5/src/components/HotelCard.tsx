import { Link } from "react-router-dom";
import type { Hotel, Tag } from "../lib/api/types";
import { TagList } from "./TagList";

interface HotelCardProps {
  hotel: Hotel;
  queryString: string;
  tagDict: Record<string, Tag>;
}

export function HotelCard({ hotel, queryString, tagDict }: HotelCardProps) {
  const cover = hotel.images[0] || "https://images.unsplash.com/photo-1445019980597-93fa8acb246c";
  const tags = hotel.tagIds.map((id) => tagDict[id]).filter(Boolean);

  return (
    <article className="hotel-card">
      <img className="hotel-card-cover" src={cover} alt={hotel.name} />
      <div className="hotel-card-body">
        <h3>{hotel.name}</h3>
        <p className="hotel-card-meta">
          {hotel.city} · {hotel.district} · {hotel.starRating} 星
        </p>
        <p className="hotel-card-address">{hotel.address}</p>
        <TagList tags={tags} />
        <div className="hotel-card-footer">
          <div>
            <span className="price-sign">¥</span>
            <strong>{hotel.minPrice}</strong>
            <span className="price-unit"> 起/晚</span>
          </div>
          <Link className="btn-secondary" to={`/hotel/${hotel.id}${queryString ? `?${queryString}` : ""}`}>
            查看详情
          </Link>
        </div>
      </div>
    </article>
  );
}
