export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TikDownloader",
    "description": "Free TikTok video downloader without watermark",
    "url": "https://tikdownloader.com",
    "applicationCategory": "Utility",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "author": {
      "@type": "Organization",
      "name": "TikDownloader",
      "url": "https://tikdownloader.com"
    },
    "potentialAction": {
      "@type": "Action",
      "target": "https://tikdownloader.com/",
      "actionPlatform": ["DesktopWebPlatform", "MobileWebPlatform"],
      "result": "Video downloaded"
    }
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
}
