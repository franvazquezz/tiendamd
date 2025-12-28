type BannerProps = {
  banner: { type: "success" | "error"; message: string } | null;
};

export const Banner = ({ banner }: BannerProps) =>
  banner ? (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
        banner.type === "success"
          ? "bg-primary/10 text-primary"
          : "bg-secondary/20 text-plum"
      }`}
    >
      {banner.message}
    </div>
  ) : null;
