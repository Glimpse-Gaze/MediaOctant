type Example = {
  id: string;
  kind: string;
  url: string | null;
  storagePath: string | null;
  caption: string;
};

function mediaSrc(ex: Example) {
  return ex.storagePath || ex.url || "";
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

export function ExampleGallery({ examples }: { examples: Example[] }) {
  if (!examples.length) {
    return <p className="mt-3 text-sm text-[var(--muted)]">No examples yet.</p>;
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {examples.map((ex) => {
        const src = mediaSrc(ex);
        return (
          <figure
            key={ex.id}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
          >
            {ex.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={ex.caption || "Example"} className="aspect-video w-full object-cover" />
            ) : isYouTube(src) ? (
              <iframe
                src={youTubeEmbed(src)}
                title={ex.caption || "Video example"}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={src} controls className="aspect-video w-full bg-black" />
            )}
            {ex.caption ? (
              <figcaption className="px-3 py-2 text-sm text-[var(--muted)]">
                {ex.caption}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
