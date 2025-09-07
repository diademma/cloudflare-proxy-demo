export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/proxy") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) return new Response("Missing url", { status: 400 });

      // Проксируем запрос
      const resp = await fetch(targetUrl, {
        headers: {
          // Позволяет обойти ограничения Google
          "User-Agent": "Mozilla/5.0 (compatible; ProxyBot/1.0)"
        }
      });

      // Определяем тип контента
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.startsWith("text/html")) {
        let html = await resp.text();
        // Заменяем все src/href на ссылки через воркер
        html = html.replace(/(src|href)=["'](https?:\/\/[^"']+)["']/g, (match, attr, link) => {
          // Не переписываем ссылки на mailto:, tel:, data:, javascript:
          if (/^(mailto:|tel:|data:|javascript:)/.test(link)) return match;
          return `${attr}="/proxy?url=${encodeURIComponent(link)}"`;
        });
        return new Response(html, {
          headers: { "content-type": "text/html; charset=UTF-8" }
        });
      } else {
        // Для других типов — отдаём как есть
        return new Response(await resp.arrayBuffer(), {
          headers: { "content-type": contentType }
        });
      }
    }

    // Для других путей — отдаём заглушку
    return new Response("Proxy worker is running.", { status: 200 });
  }
}
