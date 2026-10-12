import { ImageResponse } from "next/og";

type Context = { params: Promise<{ size: string }> };

export async function GET(_request: Request, context: Context) {
  const { size } = await context.params;
  const px = size === "512" ? 512 : 192;

  const barWidth = px * 0.5;
  const barHeight = px * 0.085;
  const left = (px - barWidth) / 2;
  const top = (px - barHeight) / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#111111",
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: barWidth,
            height: barHeight,
            borderRadius: barHeight,
            background: "#ffffff",
            transform: "rotate(45deg)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left,
            top,
            width: barWidth,
            height: barHeight,
            borderRadius: barHeight,
            background: "#d2561f",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    { width: px, height: px }
  );
}