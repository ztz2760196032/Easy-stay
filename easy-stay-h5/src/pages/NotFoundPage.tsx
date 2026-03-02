import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page">
      <header className="page-header">
        <h1>页面不存在</h1>
        <p>请返回首页继续浏览。</p>
      </header>
      <div className="card">
        <Link className="btn-primary" to="/">
          返回首页
        </Link>
      </div>
    </section>
  );
}
