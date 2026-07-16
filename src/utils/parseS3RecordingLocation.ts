export function parseS3RecordingLocation(
  recordingUrl?: string | null
): { bucket: string; key: string } | null {
  if (!recordingUrl?.trim()) {
    return null;
  }

  const raw = recordingUrl.trim();

  if (raw.startsWith("s3://")) {
    const withoutPrefix = raw.slice(5);
    const slashIndex = withoutPrefix.indexOf("/");

    if (slashIndex === -1) {
      return null;
    }

    return {
      bucket: withoutPrefix.slice(0, slashIndex),
      key: decodeURIComponent(
        withoutPrefix.slice(slashIndex + 1)
      ),
    };
  }

  if (
    raw.includes("X-Amz-Algorithm=") ||
    raw.includes("X-Amz-Signature=")
  ) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/^\/+/, "");

    const virtualHostedMatch = host.match(
      /^(.+?)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/
    );

    if (virtualHostedMatch && pathname) {
      return {
        bucket: virtualHostedMatch[1],
        key: decodeURIComponent(pathname),
      };
    }

    if (
      host.startsWith("s3.") &&
      host.includes("amazonaws.com") &&
      pathname
    ) {
      const segments = pathname.split("/").filter(Boolean);

      if (segments.length < 2) {
        return null;
      }

      const [bucket, ...rest] = segments;

      return {
        bucket,
        key: decodeURIComponent(rest.join("/")),
      };
    }
  } catch {
    // fall through to legacy parser
  }

  if (raw.includes(".amazonaws.com/")) {
    const [prefix, keyPart] = raw.split(".amazonaws.com/");

    if (!keyPart) {
      return null;
    }

    const key = decodeURIComponent(
      keyPart.split("?")[0]
    );
    const bucketMatch = prefix.match(/https?:\/\/([^.]+)/);

    if (!bucketMatch) {
      return null;
    }

    return {
      bucket: bucketMatch[1],
      key,
    };
  }

  return null;
}

export function guessRecordingContentType(
  key: string
) {
  const lower = key.toLowerCase();

  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  if (lower.endsWith(".wav")) {
    return "audio/wav";
  }

  if (lower.endsWith(".m4a")) {
    return "audio/mp4";
  }

  if (lower.endsWith(".ogg")) {
    return "audio/ogg";
  }

  if (lower.endsWith(".webm")) {
    return "audio/webm";
  }

  return "audio/mpeg";
}

export function isPlayableHttpUrl(
  recordingUrl?: string | null
) {
  if (!recordingUrl?.trim()) {
    return false;
  }

  return /^https?:\/\//i.test(recordingUrl.trim());
}

export function isPresignedS3Url(
  recordingUrl?: string | null
) {
  if (!recordingUrl) {
    return false;
  }

  return (
    recordingUrl.includes("X-Amz-Algorithm=") ||
    recordingUrl.includes("X-Amz-Signature=")
  );
}
